import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../js/preview-readonly.js',import.meta.url),'utf8');
function context(path){
 const calls=[],listeners={};const window={fetch:async(...args)=>{calls.push(args);return new Response('{}');}};
 class XHR{open(){} send(){}}
 class Storage{constructor(){this.values=new Map()}get length(){return this.values.size}getItem(key){return this.values.get(String(key))??null}setItem(key,value){this.values.set(String(key),String(value))}removeItem(key){this.values.delete(String(key))}key(index){return [...this.values.keys()][index]??null}clear(){this.values.clear()}}
 const localStorage=new Storage(),sessionStorage=new Storage();
 localStorage.setItem('campobase.theme','production');
 const databaseNames=[];
 const indexedDB={open(name){databaseNames.push(name);return name},deleteDatabase(name){databaseNames.push(`deleted:${name}`);return name},async databases(){return [{name:'campobase'}, {name:'campobase.preview.v2:campobase'}]}};
 const document={documentElement:{classList:{add(){}}},head:{append(){}},createElement(){return {}},addEventListener(name,listener){(listeners[name]??=[]).push(listener)}};
 const ctx={window,location:{hostname:'miguelperezh.github.io',pathname:path,href:`https://miguelperezh.github.io${path}`},URL,Request,Response,XMLHttpRequest:XHR,Storage,localStorage,sessionStorage,indexedDB,navigator:{sendBeacon:()=>true},document,alert(){}};
 vm.runInNewContext(source,ctx);return {window,calls,localStorage,sessionStorage,indexedDB,databaseNames,listeners};
}
test('la preview permite lecturas y acceso existente pero bloquea cambios REST, Storage y RPC mutantes',async()=>{
 const {window,calls}=context('/campobase-preview/');const base='https://mdzpygfwugawlmknywxa.supabase.co';
 for(const [path,method] of [['/rest/v1/jugadores','POST'],['/rest/v1/partidos?id=eq.1','DELETE'],['/storage/v1/object/videos/a','PUT'],['/rest/v1/rpc/set_delegate_permissions','POST']]){
  const res=await window.fetch(base+path,{method});assert.equal(res.status,403);
 }
 assert.equal(calls.length,0);
 for(const [path,method] of [['/rest/v1/jugadores','GET'],['/auth/v1/token?grant_type=password','POST'],['/rest/v1/rpc/resolve_login_email','POST'],['/rest/v1/rpc/mi_equipo_contexto','POST']])assert.equal((await window.fetch(base+path,{method})).status,200);
 assert.equal(calls.length,4);
});
test('el despliegue productivo conserva su acceso y transporte sin cambios',async()=>{
 const {window,calls}=context('/campobase/');assert.equal(window.__CAMPOBASE_READONLY_PREVIEW,undefined);
 await window.fetch('https://mdzpygfwugawlmknywxa.supabase.co/rest/v1/jugadores',{method:'POST'});assert.equal(calls.length,1);
});
test('la preview no ve ni altera el almacenamiento de la app original',async()=>{
 const {localStorage,sessionStorage,indexedDB,databaseNames}=context('/campobase-preview/');
 assert.equal(localStorage.getItem('campobase.theme'),null);
 localStorage.setItem('campobase.theme','claude');
 sessionStorage.setItem('campobase.sessionRole','owner');
 assert.equal(localStorage.values.get('campobase.theme'),'production');
 assert.equal(localStorage.values.get('campobase.preview.v2:campobase.theme'),'claude');
 assert.equal(sessionStorage.values.get('campobase.preview.v2:campobase.sessionRole'),'owner');
 indexedDB.open('campobase');
 indexedDB.deleteDatabase('campobase');
 assert.deepEqual(databaseNames,['campobase.preview.v2:campobase','deleted:campobase.preview.v2:campobase']);
 assert.deepEqual((await indexedDB.databases()).map(database=>database.name),['campobase']);
 localStorage.clear();
 assert.equal(localStorage.values.get('campobase.theme'),'production');
 assert.equal(localStorage.getItem('campobase.theme'),null);
});

test('el acceso con PIN permite crear y verificar la sesión sin autorizar escrituras de datos',async()=>{
 const {window,calls}=context('/campobase-preview/');const base='https://mdzpygfwugawlmknywxa.supabase.co';
 for(const path of ['/functions/v1/pin-login','/auth/v1/verify']) assert.equal((await window.fetch(base+path,{method:'POST'})).status,200);
 assert.equal(calls.length,2);
 assert.equal((await window.fetch(base+'/rest/v1/settings',{method:'POST'})).status,403);
 assert.equal(calls.length,2);
});

test('la preview permite operar los botones locales sin abrir escrituras de red',()=>{
 const {listeners}=context('/campobase-preview/');
 const click=selector=>{
  let blocked=false;
  const button={id:'',matches(list){return list.split(', ').includes(selector)},closest(target){return target==='#app'?{}:null}};
  const event={target:{closest(target){return target==='button'?button:null}},preventDefault(){blocked=true},stopImmediatePropagation(){blocked=true}};
  for(const listener of listeners.click)listener(event);
  return blocked;
 };
 for(const selector of ['.prep-open','#prep-save','[data-prep-formation]','.edit-player','.delete-player','.match-detail'])assert.equal(click(selector),false);
});
