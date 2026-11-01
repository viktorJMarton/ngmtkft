import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
test('HTTP and www redirect to HTTPS canonical host preserving path and query',async()=>{
 for(const source of ['http://ngmtkft.hu/kapcsolat/?from=test','https://www.ngmtkft.hu/kapcsolat/?from=test','http://www.ngmtkft.hu/kapcsolat/?from=test']) {
  const response=await worker.fetch(new Request(source),{});
  assert.equal(response.status,301);assert.equal(response.headers.get('location'),'https://ngmtkft.hu/kapcsolat/?from=test');
 }
});
test('canonical requests preserve asset responses, redirects and real 404 status',async()=>{
 for(const status of [200,307,404]) {
  const response=new Response('asset',{status});let calls=0;
  const result=await worker.fetch(new Request('https://ngmtkft.hu/kapcsolat/'),{ASSETS:{fetch(request){calls++;assert.equal(request.url,'https://ngmtkft.hu/kapcsolat/');return response;}}});
  assert.equal(calls,1);assert.equal(result,response);assert.equal(result.status,status);
 }
});
