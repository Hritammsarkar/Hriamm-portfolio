import Portfolio from './portfolio';
import { initialContent } from './content';
import {readContent} from './storage';
export const dynamic='force-dynamic';
export default async function Home(){try{const data=await readContent();return <Portfolio content={data.content}/>}catch(e){console.error('Portfolio storage unavailable',e);return <><div className="storage-notice" role="status">The latest edits aren’t available right now. Please try again in a moment.</div><Portfolio content={initialContent}/></>}}
