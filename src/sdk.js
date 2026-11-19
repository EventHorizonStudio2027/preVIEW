/* preVIEW SDK v0.8 — opt-in checkpoint protocol for browser games. */
(function(){
 let handlers=null,session=null;
 const send=(type,payload={})=>{if(window.parent!==window&&session)window.parent.postMessage({previewSDK:1,session,type,...payload},'*')};
 window.addEventListener('message',async event=>{
  if(event.source!==window.parent||!event.data||event.data.previewHost!==1)return;
  const msg=event.data;
  if(msg.type==='init'&&typeof msg.session==='string'&&msg.session.length>=16){session=msg.session;send('ready',{supported:!!handlers});return}
  if(!session||msg.session!==session||!handlers)return;
  try{
   if(msg.type==='capture'){const state=await handlers.capture();const serialized=JSON.stringify(state);if(!serialized||serialized.length>250000)throw Error('Checkpoint exceeds 250 KB');send('checkpoint',{requestId:msg.requestId,state:JSON.parse(serialized)})}
   if(msg.type==='pause'||msg.type==='resume'){if(typeof handlers[msg.type]!=='function')throw Error('Game has not implemented '+msg.type+' support');await handlers[msg.type]();send('restored',{requestId:msg.requestId})}
   if(msg.type==='restore'){await handlers.restore(msg.state);send('restored',{requestId:msg.requestId})}
  }catch(error){send('error',{requestId:msg.requestId,message:String(error.message||error).slice(0,180)})}
 });
 window.preVIEW={register(value){if(!value||typeof value.capture!=='function'||typeof value.restore!=='function')throw Error('Provide capture and restore functions');handlers=value;if(session)send('ready',{supported:true})},emit(name,detail=''){if(typeof name!=='string'||! /^[a-z][a-z0-9_.-]{0,63}$/i.test(name))throw Error('Invalid event name');send('event',{name,detail:String(detail).slice(0,140)})},version:'0.8.0'};
})();
