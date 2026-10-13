import {z} from 'zod';
import {defaultAbout} from './content';
const text=z.string().trim().min(1).max(4000),short=z.string().trim().min(1).max(150);
const uploadedPath=/^\/api\/files\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(pdf|png|jpg)$/;
function safeHttpsUrl(value:string){
  if(/[\s\u0000-\u001f\u007f]/.test(value))return false;
  try{
    const url=new URL(value);
    return url.protocol==='https:'&&url.hostname.length>0&&!url.username&&!url.password;
  }catch{return false}
}
const httpsLink=z.string().trim().max(2048).refine(safeHttpsUrl,'Use an HTTPS URL without embedded credentials.');
const link=z.string().trim().max(2048).refine(value=>value===''||safeHttpsUrl(value)||uploadedPath.test(value)||value==='/Hritamm-Sarkar-Resume.pdf','Use an HTTPS URL or an uploaded file.');
export const contentSchema=z.object({
  about:z.object({college:short,degree:short,bio:text,interests:z.array(short).min(1).max(12)}).strict().default(defaultAbout),
  name:short,role:short,intro:text,email:z.string().trim().email().max(254),
  linkedin:httpsLink,github:httpsLink,location:short,
  resume:link.refine(value=>value!==''&&(!value.startsWith('/api/files/')||value.endsWith('.pdf')),'Your resume must be a PDF file or an HTTPS URL.'),
  skills:z.array(z.object({name:short,items:z.array(short).min(1).max(40)}).strict()).min(1).max(20),
  projects:z.array(z.object({
    id:z.string().regex(/^[a-z0-9-]+$/).max(80),name:short,category:short,status:short,description:text,
    details:z.array(text).min(1).max(12),stack:z.array(short).min(1).max(40),
    areas:z.array(z.number().int().min(0).max(1)).length(5),link
  }).strict()).min(1).max(30).refine(value=>new Set(value.map(project=>project.id)).size===value.length,'Project IDs must be unique'),
  certificates:z.array(z.object({title:short,issuer:short,date:short,description:text,url:link}).strict()).max(40)
}).strict();
