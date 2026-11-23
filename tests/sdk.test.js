import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/sdk.js', import.meta.url), 'utf8');
function harness(){
  const listeners = {};
  const sent = [];
  const parent = { postMessage(message){ sent.push(message); } };
  const window = { parent, addEventListener(type,fn){ listeners[type]=fn; } };
  vm.runInNewContext(source, { window, Error, JSON, String });
  return { window, parent, sent, receive(data,sourceWindow=parent){ return listeners.message({source:sourceWindow,data}); } };
}

test('SDK ignores messages not sent by the parent window',()=>{
  const h=harness();
  h.receive({previewHost:1,type:'init',session:'session-token-123456'}, {});
  assert.equal(h.sent.length,0);
});

test('SDK requires a valid session before responding to host commands',()=>{
  const h=harness();
  h.receive({previewHost:1,type:'init',session:'short'});
  assert.equal(h.sent.length,0);
  h.receive({previewHost:1,type:'capture',requestId:'r1'});
  assert.equal(h.sent.length,0);
});

test('SDK announces unsupported state until handlers are registered',()=>{
  const h=harness();
  h.receive({previewHost:1,type:'init',session:'session-token-123456'});
  assert.equal(h.sent.at(-1).type,'ready');
  assert.equal(h.sent.at(-1).supported,false);
  h.window.preVIEW.register({capture:()=>({score:7}),restore:()=>{}});
  assert.equal(h.sent.at(-1).type,'ready');
  assert.equal(h.sent.at(-1).supported,true);
});

test('SDK capture returns a serializable checkpoint tied to request id',async()=>{
  const h=harness();
  h.window.preVIEW.register({capture:()=>({score:7}),restore:()=>{}});
  h.receive({previewHost:1,type:'init',session:'session-token-123456'});
  h.receive({previewHost:1,type:'capture',session:'session-token-123456',requestId:'capture-1'});
  await new Promise(resolve=>setImmediate(resolve));
  const reply=h.sent.find(message=>message.type==='checkpoint');
  assert.deepEqual(JSON.parse(JSON.stringify(reply.state)),{score:7});
  assert.equal(reply.requestId,'capture-1');
});

test('SDK rejects unregistered or non-serializable checkpoint values',async()=>{
  const h=harness();
  h.window.preVIEW.register({capture:()=>undefined,restore:()=>{}});
  h.receive({previewHost:1,type:'init',session:'session-token-123456'});
  h.receive({previewHost:1,type:'capture',session:'session-token-123456',requestId:'capture-2'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.sent.at(-1).type,'error');
  assert.equal(h.sent.at(-1).requestId,'capture-2');
});

test('SDK rejects invalid event names and bounds event details',()=>{
  const h=harness();
  assert.throws(()=>h.window.preVIEW.emit('not valid'));
  assert.doesNotThrow(()=>h.window.preVIEW.emit('level.complete','x'.repeat(300)));
});
