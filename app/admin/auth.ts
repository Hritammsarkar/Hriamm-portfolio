import {getChatGPTUser} from '../chatgpt-auth';import {database} from '../storage';
// Verified owner of the existing Site. Contact email is edited separately.
const OWNER_EMAIL='sarkarhritammofficial@gmail.com';
export async function isOwner(){const user=await getChatGPTUser();if(!user)return false;const db=database();let row=await db.prepare('SELECT user_id FROM owner_identity WHERE id = 1').first<{user_id:string}>();if(!row){if(user.email.trim().toLowerCase()!==OWNER_EMAIL)return false;await db.prepare('INSERT OR IGNORE INTO owner_identity (id, user_id) VALUES (1, ?)').bind(user.userId).run();row=await db.prepare('SELECT user_id FROM owner_identity WHERE id = 1').first<{user_id:string}>()}return row?.user_id===user.userId}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return origin!==null&&origin===new URL(req.url).origin&&req.headers.get('sec-fetch-site')!=='cross-site'}
