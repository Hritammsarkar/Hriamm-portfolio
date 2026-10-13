import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import {isOwner} from './auth';
import {readContent} from '../storage';
import Editor from './editor';
export const dynamic='force-dynamic';
export const metadata={title:'Private studio | Hritamm Sarkar',robots:{index:false,follow:false}};
type Props={searchParams:Promise<{error?:string}>};
export default async function Admin({searchParams}:Props){
  const user=await getChatGPTUser();
  const local=import.meta.env.DEV;
  if(!user){
    const {error}=await searchParams;
    return <main className="access-page"><a className="wordmark" href="/">hs<span>✳</span></a><p className="eyebrow">PRIVATE STUDIO</p><h1>Edit your<br/><i>portfolio.</i></h1><p>Sign in to update your projects, skills and resume.</p>
      {local?<form className="studio-login" method="post" action="/api/admin/local-session"><label htmlFor="studio-password">Studio password</label><input id="studio-password" name="password" type="password" autoComplete="current-password" required maxLength={512}/>{error&&<p className="login-error" role="alert">{error==='wait'?'Too many attempts. Wait a minute and try again.':'That password didn’t match. Try again.'}</p>}<button className="button" type="submit">Sign in</button><small>Your password is in the private access file shared in chat.</small></form>:<a className="button" href={chatGPTSignInPath('/admin')} target="_top">Sign in with ChatGPT</a>}
      <a className="text-link" href="/">Back to my portfolio</a></main>;
  }
  try{
    if(!await isOwner())return <main className="access-page"><p className="eyebrow">PRIVATE STUDIO</p><h1>This account<br/>can’t edit.</h1><p>Sign in with the owner account to make changes.</p><a className="button" href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">Switch account</a><a className="text-link" href="/">Back to my portfolio</a></main>;
    const data=await readContent();return <Editor initial={data.content} initialRevision={data.revision} local={local}/>;
  }catch(e){
    console.error('Admin unavailable',e);
    return <main className="access-page"><h1>Can’t open<br/>the studio yet.</h1><p>Something went wrong loading your saved content. Please try again.</p><a className="button" href="/admin">Try again</a><a className="text-link" href="/">Back to my portfolio</a></main>;
  }
}
