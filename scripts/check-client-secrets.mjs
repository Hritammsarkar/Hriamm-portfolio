import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const client=join(root,'dist','client');
const secrets=[];
try{
  const password=(await readFile(join(root,'.sites-runtime','local-studio-password'),'utf8')).trim();
  if(password)secrets.push(password);
}catch(error){if(error.code!=='ENOENT')throw error}
for(const name of await readdir(root)){
  if(!/^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(name))continue;
  const source=await readFile(join(root,name),'utf8');
  for(const line of source.split(/\r?\n/)){
    const match=line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*?)\s*$/);
    if(!match||!/(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i.test(match[1]))continue;
    const value=match[2].replace(/^(['"])(.*)\1$/,'$2');
    if(value.length>=12)secrets.push(value);
  }
}
const leaked=[];
let checked=0;
async function scan(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory()){await scan(path);continue}
    if(!/\.(?:js|mjs|json|map|html|css)$/.test(entry.name))continue;
    const source=await readFile(path,'utf8');
    checked++;
    if(secrets.some(secret=>source.includes(secret))||/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}|\bgh[pousr]_[A-Za-z0-9]{36,}|\bAKIA[A-Z0-9]{16}\b/.test(source))leaked.push(relative(root,path));
  }
}
await scan(client);
if(leaked.length){
  console.error('Potential secret exposure in client artifacts. Values are redacted. Files:',leaked);
  process.exitCode=1;
}else console.log(`Client secret check passed (${checked} files; credential values are never printed).`);
