import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {pets as seedPets} from '../data';
import {formatAge} from '../discovery';
import type {ManagedPet,SiteSettings,Plan,Catalog} from '../catalog-types';
import {seedDemoMarketplaces} from './demo-market-seed';
let database:DatabaseSync|undefined;
export function db(){
 if(process.env.LOCAL_ADMIN_ENABLED!=='true')throw new Error('Local database is disabled. Run npm run setup:local.');
 if(database)return database;
 mkdirSync(path.join(process.cwd(),'.data'),{recursive:true});
 database=new DatabaseSync(path.join(process.cwd(),'.data','petzo.sqlite'));
 database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS pets(id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS plans(id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS admin_sessions(nonce TEXT PRIMARY KEY,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS login_attempts(id INTEGER PRIMARY KEY CHECK(id=1),attempts INTEGER NOT NULL,started INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS adoption_listings(id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL,owner_token_hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS adoption_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,listing_id INTEGER NOT NULL,data TEXT NOT NULL,FOREIGN KEY(listing_id) REFERENCES adoption_listings(id) ON DELETE CASCADE); CREATE TABLE IF NOT EXISTS pet_market_listings(id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL,owner_token_hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS pet_market_enquiries(id INTEGER PRIMARY KEY AUTOINCREMENT,listing_id INTEGER NOT NULL,data TEXT NOT NULL);`);
 if(!database.prepare('SELECT id FROM settings WHERE id=1').get()){
  const settings:SiteSettings={announcement:'Responsible pet mating starts with informed, caring owners.',heroTitle:'The right mate. A thoughtful start.',heroAccent:'For the love of pets.',heroDescription:'Discover breeding profiles for dogs and cats. Compare breed, age and location, get to know the owner, and put your pet’s wellbeing first.',contactEmail:''};
  database.exec('BEGIN IMMEDIATE');try{
   database.prepare('INSERT INTO settings(id,data) VALUES(1,?)').run(JSON.stringify(settings));
   for(const p of seedPets){const item:ManagedPet={...p,status:'approved',availability:true,description:'A friendly companion. This is an illustrative development profile, not a verified listing.',health:'No health records have been verified for this sample profile.',vaccination:'Not verified',weight:0,temperament:p.type==='Dog'?'Playful & friendly':'Calm & curious',ownerName:'Sample owner',ownerEmail:'',sample:true,updatedAt:new Date().toISOString()};database.prepare('INSERT INTO pets(id,data) VALUES(?,?)').run(p.id,JSON.stringify(item));}
   const plans=[{name:'Free',price:0,months:1,description:'Explore the community.',features:['Browse approved pet profiles','Explore basic suggestions','Save favourite pet profiles'],active:true,premium:false},{name:'Premium',price:499,months:1,description:'Local development price. Checkout is not connected.',features:['Mating requests (planned)','Private chat after acceptance (planned)','Additional listings (planned)'],active:true,premium:true}];
   for(const plan of plans){const result=database.prepare('INSERT INTO plans(data) VALUES(?)').run('{}');database.prepare('UPDATE plans SET data=? WHERE id=?').run(JSON.stringify({...plan,id:Number(result.lastInsertRowid)}),result.lastInsertRowid)}
   database.exec('COMMIT');
  }catch(error){database.exec('ROLLBACK');throw error}
 }
 seedDemoMarketplaces(database);
 return database;
}
export function allPets():ManagedPet[]{return db().prepare('SELECT data FROM pets ORDER BY id DESC').all().map(r=>JSON.parse(String(r.data)))}
export function allPlans():Plan[]{return db().prepare('SELECT data FROM plans ORDER BY id').all().map(r=>JSON.parse(String(r.data)))}
export function settings():SiteSettings{return JSON.parse(String(db().prepare('SELECT data FROM settings WHERE id=1').get()!.data))}
export function audit(action:string){db().prepare('INSERT INTO audit(action,created_at) VALUES(?,?)').run(action,new Date().toISOString())}
export function publicCatalog():Catalog{return {pets:allPets().filter(p=>p.status==='approved'&&p.availability).map(({ownerName,ownerEmail,status,updatedAt,discoveryPreferences,...p})=>({...p,age:formatAge(p.age)})),settings:settings(),plans:allPlans().filter(p=>p.active),updatedAt:new Date().toISOString()}}
