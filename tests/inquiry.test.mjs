import test from 'node:test';
import assert from 'node:assert/strict';
import { submitInquiry } from '../lib/inquiry.mjs';
test('sends the original form data and accepts a confirmed submission',async()=>{
 const data=new FormData();data.set('product','Quadrato');
 await submitInquiry('https://example.invalid/form',data,async(url,options)=>{
  assert.equal(options.body,data);assert.equal(options.method,'POST');assert.equal(options.headers.Accept,'application/json');
  return {ok:true,json:async()=>({ok:true})};
 });
});
test('rejects HTTP and provider failures instead of showing success',async()=>{
 for(const [ok,body] of [[false,{ok:true}],[true,{ok:false}],[true,{}],[true,null]]){
  await assert.rejects(submitInquiry('',new FormData(),async()=>({ok,json:async()=>body})));
 }
});
test('rejects malformed responses and network errors',async()=>{
 await assert.rejects(submitInquiry('',new FormData(),async()=>({ok:true,json:async()=>{throw Error('invalid JSON')}})));
 await assert.rejects(submitInquiry('',new FormData(),async()=>{throw Error('offline')}));
});
test('aborts stalled requests',async()=>{
 await assert.rejects(submitInquiry('',new FormData(),(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')))),10));
});
