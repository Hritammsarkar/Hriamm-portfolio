import {env} from 'cloudflare:workers';
import {isOwner,sameOrigin} from '../../admin/auth';
import {database} from '../../storage';
import {allowedFileType,apiError,enforceRateLimit,readBoundedBody,RequestError} from '../security';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  try{
    if(!sameOrigin(req))return apiError('Invalid request origin.',403);
    if(!await isOwner())return apiError('Owner access required.',403);
    const limited=await enforceRateLimit(database(),'file-upload',10);
    if(limited)return limited;
    if(!env.BUCKET)return apiError('File storage unavailable.',503);
    const purpose=req.headers.get('x-upload-purpose');
    if(purpose!=='resume'&&purpose!=='certificate')return apiError('Choose a resume or certificate upload.',400);
    if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='multipart/form-data')return apiError('A file upload is required.',415);
    const raw=await readBoundedBody(req,11*1024*1024);
    let data:FormData;
    try{data=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')!},body:raw}).formData()}catch{return apiError('Invalid file upload.',400)}
    const entries=Array.from(data.entries());
    if(entries.length!==1||entries[0][0]!=='file')return apiError('Upload one file at a time.',400);
    const file=entries[0][1];
    if(!(file instanceof File)||file.size===0)return apiError('Choose a PDF, JPG or PNG under 10 MB.',400);
    if(file.size>10*1024*1024)return apiError('Maximum file size is 10 MB.',413);
    const bytes=new Uint8Array(await file.arrayBuffer());
    const detected=allowedFileType(bytes);
    if(!detected)return apiError('Only PDF, PNG and JPG files are accepted.',400);
    if(purpose==='resume'&&detected.contentType!=='application/pdf')return apiError('Your resume must be a PDF.',400);
    if(file.type&&file.type!==detected.contentType)return apiError('The file type does not match its contents.',400);
    const key=crypto.randomUUID()+'.'+detected.extension;
    await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:detected.contentType}});
    return Response.json({url:'/api/files/'+key,type:detected.contentType},{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){
    if(error instanceof RequestError)return apiError(error.message,error.status);
    console.error('Upload failed');
    return apiError('Upload failed. Please try again.',503);
  }
}
