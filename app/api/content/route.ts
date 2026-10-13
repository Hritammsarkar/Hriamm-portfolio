import {z} from 'zod';
import {database,readContent,saveContent} from '../../storage';
import {isOwner,sameOrigin} from '../../admin/auth';
import {contentSchema} from '../../content-schema';
import {apiError,enforceRateLimit,readBoundedBody,RequestError} from '../security';
export const dynamic='force-dynamic';
const saveSchema=z.object({content:contentSchema,revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)}).strict();
export async function GET(){try{return Response.json(await readContent(),{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch{console.error('Read content failed');return apiError('Content storage is temporarily unavailable.',503)}}
export async function PUT(req:Request){
  try{
    if(!sameOrigin(req))return apiError('Invalid request origin.',403);
    if(!await isOwner())return apiError('Owner access required.',403);
    const limited=await enforceRateLimit(database(),'content-write',30);
    if(limited)return limited;
    if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return apiError('JSON required.',415);
    const raw=await readBoundedBody(req,150000);
    let body:unknown;
    try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}catch{return apiError('Invalid JSON.',400)}
    const parsed=saveSchema.safeParse(body);
    if(!parsed.success)return apiError(parsed.error.issues.slice(0,8).map(i=>i.path.join('.')+': '+i.message).join('; '),400);
    const revision=await saveContent(parsed.data.content,parsed.data.revision);
    if(revision===null)return apiError('The portfolio changed in another session. Reload before saving; copy your unsaved changes first.',409);
    return Response.json({revision},{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){
    if(error instanceof RequestError)return apiError(error.message,error.status);
    console.error('Save failed');
    return apiError('Your changes could not be saved. Please retry.',503);
  }
}
