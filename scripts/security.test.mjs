import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {Readable} from 'node:stream';

// Node strips TypeScript; resolve the extensionless imports used by Vite.
registerHooks({resolve(specifier,context,nextResolve){
  try{return nextResolve(specifier,context)}catch(error){
    if(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return nextResolve(specifier+'.ts',context);
    throw error;
  }
}});
const {readBoundedBody,RequestError,enforceRateLimit,allowedFileType,uploadedFileKey}=await import('../app/api/security.ts');
const {contentSchema}=await import('../app/content-schema.ts');
const {initialContent}=await import('../app/content.ts');
const {localStudio}=await import('../build/local-studio-plugin.ts');

function request(body,headers={}){
  return new Request('https://portfolio.example/api/content',{method:'PUT',body,headers,duplex:'half'});
}
function database(sqlite=new DatabaseSync(':memory:')){
  return {sqlite,db:{prepare(sql){
    return {async run(){sqlite.exec(sql)},bind(...values){return {async first(){return sqlite.prepare(sql).get(...values)}}}};
  }}};
}

test('request limits count UTF-8 bytes and stop oversized streams without trusting Content-Length',async()=>{
  assert.equal((await readBoundedBody(request('héllo'),6)).length,6);
  await assert.rejects(readBoundedBody(request('héllo'),5),error=>error instanceof RequestError&&error.status===413);
  let cancelled=false;
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(9))},cancel(){cancelled=true}});
  await assert.rejects(readBoundedBody(request(stream,{'Content-Length':'1'}),8),error=>error.status===413);
  assert.equal(cancelled,true);
  await assert.rejects(readBoundedBody(request('x',{'Content-Length':'not-a-number'}),8),error=>error.status===400);
  await assert.rejects(readBoundedBody(request('x',{'Content-Length':'9'}),8),error=>error.status===413);
});

test('durable rate counters enforce the limit across simultaneous calls and fresh Worker wrappers',async()=>{
  const {db,sqlite}=database();
  const replies=await Promise.all(Array.from({length:12},()=>enforceRateLimit(db,'content-write',5,60,1000)));
  assert.equal(replies.filter(reply=>reply===null).length,5);
  assert.equal(replies.filter(reply=>reply?.status===429).length,7);
  assert.equal(replies[5].headers.get('Retry-After'),'60');
  assert.equal(sqlite.prepare('SELECT attempts FROM api_rate_limits WHERE scope = ?').get('content-write').attempts,6);
  assert.equal((await enforceRateLimit(database(sqlite).db,'content-write',5,60,2000)).status,429);
  assert.equal(await enforceRateLimit(db,'file-upload',5,60,2000),null);
  assert.equal(await enforceRateLimit(db,'content-write',5,60,61000),null);
  sqlite.close();
});

test('failed rate-limit initialization can retry and never silently permits requests',async()=>{
  const {db,sqlite}=database();
  const original=db.prepare;
  let fail=true;
  db.prepare=sql=>fail?{async run(){fail=false;throw new Error('temporary failure')}}:original(sql);
  await assert.rejects(enforceRateLimit(db,'content-write',2),/temporary failure/);
  assert.equal(await enforceRateLimit(db,'content-write',2),null);
  sqlite.close();
});

test('stored links cannot contain scripts, embedded credentials or invalid upload paths',()=>{
  assert.equal(contentSchema.safeParse(initialContent).success,true);
  for(const value of ['javascript:alert(1)','https://user:password@example.com','https://example.com/line\nfeed','/api/files/--.pdf']){
    assert.equal(contentSchema.safeParse({...initialContent,projects:[{...initialContent.projects[0],link:value}]}).success,false,value);
  }
  const key='c5d68ad5-1c36-4403-9406-bde686826cc8';
  assert.equal(contentSchema.safeParse({...initialContent,resume:'/api/files/'+key+'.pdf'}).success,true);
  assert.equal(contentSchema.safeParse({...initialContent,resume:'/api/files/'+key+'.png'}).success,false);
  assert.equal(contentSchema.safeParse({...initialContent,unexpected:'field'}).success,false);
  assert.equal(contentSchema.safeParse(null).success,false);
  assert.equal(contentSchema.safeParse({...initialContent,projects:[initialContent.projects[0],initialContent.projects[0]]}).success,false);
});

test('download keys and upload signatures reject arbitrary paths and disguised executable files',()=>{
  assert.equal(uploadedFileKey.test('c5d68ad5-1c36-4403-9406-bde686826cc8.pdf'),true);
  assert.equal(uploadedFileKey.test('../../secret.pdf'),false);
  assert.equal(uploadedFileKey.test('---.pdf'),false);
  assert.equal(allowedFileType(new TextEncoder().encode('<script>alert(1)</script>')),null);
  assert.equal(allowedFileType(new TextEncoder().encode('%PDF-1.7')).contentType,'application/pdf');
  assert.equal(allowedFileType(new Uint8Array([255,216,255,224])).contentType,'image/jpeg');
  assert.equal(allowedFileType(new Uint8Array([137,80,78,71,13,10,26,10])),null);
});

test('local studio rejects spoofed identity, cross-origin login and brute-force attempts',async()=>{
  const root=mkdtempSync(join(tmpdir(),'portfolio-security-test-'));
  const password='test-only-password-abcdefghijklmnopqrstuvwxyz';
  mkdirSync(join(root,'.sites-runtime'));
  writeFileSync(join(root,'.sites-runtime','local-studio-password'),password);
  let middleware;
  localStudio({enabled:true}).configureServer({config:{root,server:{}},middlewares:{use(handler){middleware=handler}}});
  async function call(path,body='',extraHeaders={}){
    const req=Readable.from(body?[Buffer.from(body)]:[]);
    req.url=path;req.method='POST';req.socket={remoteAddress:'127.0.0.1'};
    req.headers={host:'127.0.0.1:5173',origin:'http://127.0.0.1:5173','content-type':'application/x-www-form-urlencoded',...extraHeaders};
    req.rawHeaders=Object.entries(req.headers).flat();
    const headers=new Map();
    const res={statusCode:200,setHeader(key,value){headers.set(key.toLowerCase(),value)},end(value){this.body=value}};
    let next=false;
    await middleware(req,res,()=>{next=true});
    return {req,res,headers,next};
  }
  try{
    const spoof=await call('/api/content','',{'oai-authenticated-user-id':'fake-owner'});
    assert.equal(spoof.req.headers['oai-authenticated-user-id'],undefined);
    assert.equal(spoof.next,true);
    assert.equal((await call('/api/admin/local-session','password='+password,{origin:'https://evil.example'})).res.statusCode,403);
    const login=await call('/api/admin/local-session','password='+password);
    assert.equal(login.res.statusCode,303);
    const cookie=login.headers.get('set-cookie');
    assert.match(cookie,/HttpOnly; SameSite=Strict/);
    assert.equal(cookie.includes(password),false);
    const signedIn=await call('/api/content','',{cookie:cookie.split(';',1)[0]});
    assert.equal(signedIn.req.headers['oai-authenticated-user-id'],'local-studio-owner');
    for(let attempt=0;attempt<5;attempt++)assert.equal((await call('/api/admin/local-session','password=incorrect')).res.statusCode,303);
    const blocked=await call('/api/admin/local-session','password=incorrect');
    assert.equal(blocked.res.statusCode,429);
    assert.ok(Number(blocked.headers.get('retry-after'))>0);
  }finally{assert.equal(dirname(resolve(root)),resolve(tmpdir()));assert.match(root,/portfolio-security-test-/);rmSync(root,{recursive:true,force:true})}
});
