'use client';
import {useEffect,useRef,useState} from 'react';import type {Content} from '../content';
import {contentSchema} from '../content-schema';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';import {Checkbox} from '@/components/ui/checkbox';import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {Save,Plus,Trash2,Upload,ExternalLink} from 'lucide-react';
const cleanList=(items:string[])=>items.map(item=>item.trim()).filter(Boolean);
function cleanDraft(content:Content):Content{return {...content,about:{...content.about,interests:cleanList(content.about.interests)},skills:content.skills.map(group=>({...group,items:cleanList(group.items)})),projects:content.projects.map(project=>({...project,details:cleanList(project.details),stack:cleanList(project.stack)}))}}
type ApiResult={error?:string;revision?:number;url?:string;type?:string};
async function responseData(response:Response):Promise<ApiResult>{
 const fallback=response.status===429?'Too many requests. Wait a moment and try again.':response.status===401||response.status===403?'Your session has expired. Sign in again before saving.':response.status===409?'The portfolio changed in another session. Reload it before saving again.':'Request failed ('+response.status+'). Please try again.';
 let data:unknown;
 try{data=await response.json()}catch{throw Error(response.ok?'The server returned an unreadable response. Please try again.':fallback)}
 const result=data&&typeof data==='object'?data as ApiResult:{};
 if(!response.ok){
  throw Error(typeof result.error==='string'&&result.error?result.error:fallback);
 }
 return result;
}
const fieldPath=(path:(string|number)[])=>path.map(part=>typeof part==='number'?'item '+(part+1):part.replace(/([a-z])([A-Z])/g,'$1 $2')).join(' / ');
export default function Editor({initial,initialRevision,local=false}:{initial:Content;initialRevision:number;local?:boolean}){
 const [content,setContent]=useState(initial),[revision,setRevision]=useState(initialRevision),[saved,setSaved]=useState(JSON.stringify(initial)),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[remove,setRemove]=useState<{type:'projects'|'certificates';index:number}|null>(null);
 const requestInFlight=useRef(false);
 const dirty=JSON.stringify(content)!==saved;const set=(key:keyof Content,value:unknown)=>{setStatus('');setContent(c=>({...c,[key]:value}))};
 useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};addEventListener('beforeunload',handler);return()=>removeEventListener('beforeunload',handler)},[dirty]);
 async function save(){
  if(requestInFlight.current)return;
  const parsed=contentSchema.safeParse(cleanDraft(content));
  if(!parsed.success){const issue=parsed.error.issues[0];setStatus('Check '+fieldPath(issue.path)+': '+issue.message);return}
  const draft=parsed.data as Content,submitted=JSON.stringify(content);
  requestInFlight.current=true;setBusy(true);setStatus('Saving…');
  try{
   const response=await fetch('/api/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:draft,revision})});
   const result=await responseData(response);
   if(typeof result.revision!=='number'||!Number.isSafeInteger(result.revision)||result.revision<1)throw Error('The save could not be confirmed. Reload your portfolio to check the latest version.');
   setRevision(result.revision);setSaved(JSON.stringify(draft));setContent(current=>JSON.stringify(current)===submitted?draft:current);setStatus('Saved. Your portfolio is up to date.');
  }catch(e){setStatus(e instanceof Error?e.message:'Save failed. Your changes are still here.')}
  finally{requestInFlight.current=false;setBusy(false)}
 }
 async function upload(file:File|undefined,cert?:number){
  if(!file||requestInFlight.current)return;
  if(!file.size||file.size>10*1024*1024){setStatus('Please choose a non-empty file under 10 MB.');return}
  const resume=cert===undefined,allowed=resume?['application/pdf']:['application/pdf','image/png','image/jpeg'];
  if(!allowed.includes(file.type)){setStatus(resume?'Your resume must be a PDF.':'Choose a PDF, PNG or JPEG certificate.');return}
  requestInFlight.current=true;setUploading(true);setStatus('Uploading…');
  try{
   const data=new FormData();data.set('file',file);
   const response=await fetch('/api/upload',{method:'POST',headers:{'X-Upload-Purpose':resume?'resume':'certificate'},body:data});
   const result=await responseData(response);
   if(typeof result.url!=='string'||!result.url||typeof result.type!=='string'||!allowed.includes(result.type))throw Error('The upload could not be confirmed. Please try again.');
   if(resume)set('resume',result.url);
   else setContent(c=>({...c,certificates:c.certificates.map((item,i)=>i===cert?{...item,url:result.url!}:item)}));
   setStatus('File uploaded. Save changes to show it on your portfolio.');
  }catch(e){setStatus(e instanceof Error?e.message:'Upload failed.')}
  finally{requestInFlight.current=false;setUploading(false)}
 }
 const field=(label:string,value:string,onChange:(v:string)=>void,multiline=false)=><label key={label} className="editor-field"><span>{label}</span>{multiline?<textarea aria-label={label} rows={3} value={value} onChange={e=>onChange(e.target.value)}/>:<input aria-label={label} type={label==='Contact email'?'email':'text'} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
 return <main className="studio" aria-busy={busy||uploading}><header className="studio-header"><a className="wordmark" href="/">hs<span>✳</span></a><div><h1>Private studio</h1><p>{content.name} / Your workspace</p></div><a className="text-link" target="_blank" rel="noopener noreferrer" href="/">View portfolio</a>{local?<form method="post" action="/api/admin/local-session?logout=1"><button className="text-link" type="submit">Sign out</button></form>:<a className="text-link" target="_top" href="/signout-with-chatgpt?return_to=%2Fadmin">Sign out</a>}</header><div className="studio-toolbar"><div><span className="eyebrow">UPDATE YOUR PORTFOLIO</span><h2>What would you <i>like to update?</i></h2></div><button className="button" disabled={busy||uploading||!dirty} onClick={save}><Save size={16}/>{busy?'Saving…':'Save changes'}</button></div><div className="save-status" role="status">{dirty&&status.startsWith('Saved.')?'Unsaved changes':status|| (dirty?'Unsaved changes':'All changes saved')}<span>Version {revision}</span></div>
 <Tabs defaultValue="profile"><TabsList className="studio-tabs"><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="about">About</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger><TabsTrigger value="skills">Skills</TabsTrigger><TabsTrigger value="credentials">Certificates</TabsTrigger><TabsTrigger value="resume">Resume</TabsTrigger></TabsList>
 <TabsContent value="profile"><div className="editor-grid">{field('Name',content.name,v=>set('name',v))}{field('Professional focus',content.role,v=>set('role',v))}{field('Introduction',content.intro,v=>set('intro',v),true)}{field('Location label',content.location,v=>set('location',v))}{field('Contact email',content.email,v=>set('email',v))}{field('LinkedIn / Hire me URL',content.linkedin,v=>set('linkedin',v))}{field('GitHub URL',content.github,v=>set('github',v))}</div></TabsContent>
 <TabsContent value="about"><div className="editor-grid">{field('College',content.about.college,v=>set('about',{...content.about,college:v}))}{field('Degree',content.about.degree,v=>set('about',{...content.about,degree:v}))}{field('About me',content.about.bio,v=>set('about',{...content.about,bio:v}),true)}{field('Interests (comma separated)',content.about.interests.join(', '),v=>set('about',{...content.about,interests:v.split(',').map(s=>s.trimStart())}))}</div></TabsContent>
 <TabsContent value="projects"><p className="editor-hint">Tell the story of each project and list the tools you used. Select the areas it covers to update the chart.</p>{content.projects.map((p,i)=><section className="editor-card" key={p.id}><div className="editor-card-heading"><h3>{p.name||'New project'}</h3><button aria-label={'Remove '+p.name} className="icon-button" onClick={()=>setRemove({type:'projects',index:i})} disabled={busy||uploading||content.projects.length===1}><Trash2 size={17}/></button></div><div className="editor-grid">{(['name','category','status','description','link'] as const).map(k=>field(k==='link'?'Project URL (optional)':k,p[k],v=>set('projects',content.projects.map((item,j)=>j===i?{...item,[k]:v}:item)),k==='description'))}{field('Details (one paragraph per line)',p.details.join('\n'),v=>set('projects',content.projects.map((item,j)=>j===i?{...item,details:v.split('\n')}:item)),true)}{field('Tools used (comma separated)',p.stack.join(', '),v=>set('projects',content.projects.map((item,j)=>j===i?{...item,stack:v.split(',').map(s=>s.trimStart())}:item)))}</div><div className="discipline-checks">{['AI / vision','Backend','Interfaces','Database','Embedded'].map((a,k)=><label key={a}><Checkbox checked={p.areas[k]===1} onCheckedChange={v=>set('projects',content.projects.map((item,j)=>j===i?{...item,areas:item.areas.map((n,l)=>l===k?(v?1:0):n)}:item))}/>{a}</label>)}</div></section>)}<button className="outline-button" disabled={busy||uploading} onClick={()=>set('projects',[...content.projects,{id:crypto.randomUUID(),name:'New project',category:'Software engineering',status:'In development',description:'What does your project do?',details:['Share what you built and how it works.'],stack:['Python'],areas:[0,0,0,0,0],link:''}])}><Plus size={16}/>Add project</button></TabsContent>
 <TabsContent value="skills">{content.skills.map((s,i)=><div className="editor-card" key={i}><div className="editor-grid">{field('Category',s.name,v=>set('skills',content.skills.map((a,j)=>j===i?{...a,name:v}:a)))}{field('Skills (comma separated)',s.items.join(', '),v=>set('skills',content.skills.map((a,j)=>j===i?{...a,items:v.split(',').map(x=>x.trimStart())}:a)))}</div><button className="text-link" disabled={busy||uploading||content.skills.length===1} onClick={()=>set('skills',content.skills.filter((_,j)=>j!==i))}>Remove category</button></div>)}<button className="outline-button" disabled={busy||uploading} onClick={()=>set('skills',[...content.skills,{name:'New category',items:['New skill']}])}><Plus size={16}/>Add category</button></TabsContent>
 <TabsContent value="credentials"><p className="editor-hint">Add a certificate link or upload the document. Visitors can open it once you save your changes.</p>{content.certificates.map((c,i)=><div className="editor-card" key={i}><div className="editor-card-heading"><h3>{c.title||'New certificate'}</h3><button className="icon-button" aria-label={'Remove '+c.title} onClick={()=>setRemove({type:'certificates',index:i})} disabled={busy||uploading}><Trash2 size={17}/></button></div><div className="editor-grid">{(['title','issuer','date','description','url'] as const).map(k=>field(k==='url'?'Certificate link (optional)':k,c[k],v=>set('certificates',content.certificates.map((a,j)=>j===i?{...a,[k]:v}:a)),k==='description'))}</div><label className="upload-button"><Upload size={16}/>Upload certificate<input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy||uploading} onChange={e=>{upload(e.target.files?.[0],i);e.target.value=''}}/></label></div>)}<button className="outline-button" disabled={busy||uploading} onClick={()=>set('certificates',[...content.certificates,{title:'',issuer:'',date:'2026',description:'',url:''}])}><Plus size={16}/>Add certificate</button></TabsContent>
 <TabsContent value="resume"><div className="editor-card"><h3>Resume</h3><p className="editor-hint">Upload a PDF under 10 MB. Save changes to replace the resume visitors see.</p><label className="upload-button"><Upload size={16}/>{uploading?'Uploading…':'Upload PDF'}<input type="file" accept=".pdf,application/pdf" disabled={busy||uploading} onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label><a className="outline-button" href={content.resume} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>Open current resume</a></div></TabsContent>
 </Tabs><AlertDialog open={!!remove} onOpenChange={v=>{if(!v)setRemove(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this item?</AlertDialogTitle><AlertDialogDescription>This removes the item from your draft. It will be removed from the portfolio when you save changes.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep item</AlertDialogCancel><AlertDialogAction disabled={busy||uploading} onClick={()=>{if(remove&&!busy&&!uploading)set(remove.type,content[remove.type].filter((_,i)=>i!==remove.index));setRemove(null)}}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></main>
}
