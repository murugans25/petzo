import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://localhost:3000';const headers={'Content-Type':'application/json',Origin:base};const login=await fetch(base+'/api/admin/login',{method:'POST',headers,body:JSON.stringify({email:'admin@petzo.local',password:process.env.PETZO_TEST_PASSWORD})});assert.equal(login.status,200);headers.Cookie=login.headers.get('set-cookie').split(';')[0];
const api=async(method,data)=>{const r=await fetch(base+'/api/admin/pets',{method,headers,body:data?JSON.stringify(data):undefined});assert.ok(r.ok,await r.clone().text());return r.json()};
try{
 if(process.argv[2]==='before'){
  const pets=(await api('GET')).pets;const first=pets[0];const {id,color,updatedAt,...fields}=first;const created=await api('POST',{...fields,name:'Restart persistence QA',status:'draft'});await writeFile('.data/restart-check.json',JSON.stringify({id:created.pet.id,name:created.pet.name}));console.log('Persistence fixture saved before restart.');
 }else{
  const fixture=JSON.parse(await readFile('.data/restart-check.json','utf8'));const pets=(await api('GET')).pets;assert.ok(pets.some(p=>p.id===fixture.id&&p.name===fixture.name));await api('DELETE',{id:fixture.id});await unlink('.data/restart-check.json');console.log('PASS Saved admin data survives a full server restart.');
 }
}finally{await fetch(base+'/api/admin/logout',{method:'POST',headers,body:'{}'})}

