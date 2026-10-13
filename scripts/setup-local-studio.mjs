import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const directoryForSecret=path.join(root,'.sites-runtime');fs.mkdirSync(directoryForSecret,{recursive:true});
const file=path.join(directoryForSecret,'local-studio-password');
let password=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim():'';
if(password.length<20){password=randomBytes(24).toString('base64url');fs.writeFileSync(file,password+'\n')}
const directory=path.join(root,'work');fs.mkdirSync(directory,{recursive:true});
const instructions=path.join(directory,'private-studio-access.txt');
fs.writeFileSync(instructions,'HRITAMM — PRIVATE STUDIO\n\nOpen: http://127.0.0.1:5173/admin\nPassword: '+password+'\n\nPaste this password into the studio login. Your login lasts up to 8 hours; you can sign out at any time.\n\nThis password works only for the preview on your laptop. The published studio uses your owner ChatGPT account.\nKeep this file private. The password is excluded from the source download and website build.\n');
console.log('Local studio configured. Private access details saved to '+instructions);
