// Shared state for rate budgets and result caching.
// Uses Upstash Redis (Vercel Marketplace) when configured, else per-instance memory.
const base=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
async function redis(cmd:(string|number)[]){
 const r=await fetch(base!,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(cmd),cache:'no-store',signal:AbortSignal.timeout(4000)});
 if(!r.ok)throw Error('store unavailable');
 return (await r.json() as {result:unknown}).result;
}
const LUA=`local v=redis.call('HMGET',KEYS[1],'day','count','next')
local day=tonumber(ARGV[1]) local now=tonumber(ARGV[2]) local spacing=tonumber(ARGV[3]) local daily=tonumber(ARGV[4])
local d=tonumber(v[1]) local c=tonumber(v[2]) or 0 local n=tonumber(v[3]) or 0
if n>now then return 0 end
if d==day and c>=daily then return 0 end
if d~=day then c=0 end
redis.call('HSET',KEYS[1],'day',day,'count',c+1,'next',now+spacing)
redis.call('EXPIRE',KEYS[1],172800)
return 1`;
const rows=new Map<string,{day:number,count:number,next:number}>();
const entries=new Map<string,{value:string,exp:number}>();
export const kv={
 get persistent(){return !!(base&&token);},
 async reserve(id:string,now:number,spacing:number,daily:number){
  const day=Math.floor(now/86400000);
  if(base&&token){try{return Number(await redis(['EVAL',LUA,1,'ll:quota:'+id,day,now,spacing,daily]))===1;}catch{return false;}}
  const row=rows.get(id);if(row&&row.next>now)return false;
  const count=row&&row.day===day?row.count:0;if(count>=daily)return false;
  rows.set(id,{day,count:count+1,next:now+spacing});return true;
 },
};
// Minimal Cache API look-alike (match/put) keyed by request URL; honours max-age.
export const cache={
 async match(req:Request){
  const key='ll:cache:'+req.url;
  if(base&&token){try{const v=await redis(['GET',key]);return typeof v==='string'?new Response(v,{headers:{'Content-Type':'application/json'}}):undefined;}catch{return undefined;}}
  const e=entries.get(key);if(!e||e.exp<=Date.now()){entries.delete(key);return undefined;}
  return new Response(e.value,{headers:{'Content-Type':'application/json'}});
 },
 async put(req:Request,res:Response){
  const key='ll:cache:'+req.url,age=Number(/max-age=(\d+)/.exec(res.headers.get('Cache-Control')||'')?.[1]||0),body=await res.text();
  if(age<=0)return;
  if(base&&token){try{await redis(['SET',key,body,'EX',age]);}catch{/* cache is best-effort */}return;}
  if(entries.size>500)entries.clear();
  entries.set(key,{value:body,exp:Date.now()+age*1000});
 },
};
