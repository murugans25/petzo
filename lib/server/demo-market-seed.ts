import {randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {AdoptionListing} from '../adoption-types';
import type {PetMarketListing} from '../pet-market-types';
import {hashOwnerToken} from './adoption-access';

const createdAt='2026-01-01T00:00:00.000Z';
const adoption:Omit<AdoptionListing,'id'>[]=[
 {petName:'Misty',type:'Dog',breed:'Indian Pariah',age:'3 years',gender:'Female',location:'Bengaluru',vaccination:'Owner reports core vaccinations are current. Please verify records.',health:'Bright and active per the owner. Arrange a veterinary check.',reason:'Her current family is moving and is looking for a patient, permanent home.',photos:['/pets/photo-1543466835-00a7907e9de1.jpg'],photoTitles:['Misty outdoors'],ownerKind:'individual',ownerName:'Sample owner',ownerEmail:'misty@example.test',ownerPhone:'9000000001',organizationName:'',organizationId:'',organizationVerified:false,status:'approved',createdAt,updatedAt:createdAt,sample:true},
 {petName:'Mango',type:'Cat',breed:'Domestic Shorthair',age:'1 year 6 months',gender:'Male',location:'Chennai',vaccination:'Vaccination details should be confirmed with the rescue.',health:'No known issues reported. Ask for a recent vet record.',reason:'A local rescue is helping him find an indoor, caring home.',photos:['/pets/photo-1514888286974-6c03e2ca1dba.jpg'],photoTitles:['Mango in a sunny spot'],ownerKind:'rescue',ownerName:'Sample rescue contact',ownerEmail:'mango@example.test',ownerPhone:'9000000002',organizationName:'Example rescue · demo only',organizationId:'',organizationVerified:true,status:'approved',createdAt,updatedAt:createdAt,sample:true},
 {petName:'Oreo',type:'Dog',breed:'Indie',age:'2 years',gender:'Male',location:'Hyderabad',vaccination:'Owner reports vaccinations are up to date; verify original records.',health:'Active and friendly per the owner. Arrange an independent veterinary check.',reason:'His current family is relocating and wants a stable, caring home for him.',photos:['/pets/photo-1552053831-71594a27632d.jpg'],photoTitles:['Oreo outdoors'],ownerKind:'individual',ownerName:'Sample owner',ownerEmail:'oreo@example.test',ownerPhone:'9000000003',organizationName:'',organizationId:'',organizationVerified:false,status:'approved',createdAt,updatedAt:createdAt,sample:true}
];
const market:Omit<PetMarketListing,'id'>[]=[
 {petName:'Rio',type:'Dog',breed:'Beagle',age:'1 year',gender:'Male',location:'Bengaluru',price:18000,currency:'INR',description:'Curious, cheerful young companion. Meet in person and review veterinary records before making a decision.',vaccination:'Owner-reported vaccinations; dates should be checked with the veterinary record.',health:'Sample listing only. Independent veterinary review recommended.',vetClinic:'',photos:['/pets/photo-1505628346881-b72b27e84530.jpg'],photoTitles:['Rio in the garden'],sellerKind:'breeder',sellerName:'Sample seller',sellerEmail:'rio@example.test',sellerPhone:'9000000004',establishmentName:'Example seller · demo only',registrationNumber:'',registrationDocument:null,vetDocument:null,sellerVerified:true,status:'approved',createdAt,updatedAt:createdAt,sample:true},
 {petName:'Coco',type:'Cat',breed:'Domestic Shorthair',age:'8 months',gender:'Female',location:'Chennai',price:9000,currency:'INR',description:'Gentle, playful cat. Ask the seller about temperament, health history and how she has been cared for.',vaccination:'Please confirm vaccine dates and documents directly with the seller.',health:'Owner-reported details only. Arrange an independent veterinary check before any sale.',vetClinic:'',photos:['/pets/photo-1514888286974-6c03e2ca1dba.jpg'],photoTitles:['Coco at home'],sellerKind:'individual',sellerName:'Sample seller',sellerEmail:'coco@example.test',sellerPhone:'9000000005',establishmentName:'',registrationNumber:'',registrationDocument:null,vetDocument:null,sellerVerified:true,status:'approved',createdAt,updatedAt:createdAt,sample:true},
 {petName:'Milo',type:'Dog',breed:'Golden Retriever',age:'10 months',gender:'Male',location:'Hyderabad',price:22000,currency:'INR',description:'A lively, affectionate young dog. Meet the seller and review original records in person.',vaccination:'Owner-reported vaccinations; check dates and veterinary documents.',health:'Sample listing only. Arrange an independent veterinary examination.',vetClinic:'',photos:['/pets/photo-1552053831-71594a27632d.jpg'],photoTitles:['Milo in the garden'],sellerKind:'individual',sellerName:'Sample seller',sellerEmail:'milo@example.test',sellerPhone:'9000000006',establishmentName:'',registrationNumber:'',registrationDocument:null,vetDocument:null,sellerVerified:true,status:'approved',createdAt,updatedAt:createdAt,sample:true}
];

export function seedDemoMarketplaces(database:DatabaseSync){
 database.exec('CREATE TABLE IF NOT EXISTS sample_seed_flags(id TEXT PRIMARY KEY)');
 const mark=database.prepare('INSERT OR IGNORE INTO sample_seed_flags(id) VALUES(?)');
 if(mark.run('adoption-demo-v1').changes){const insert=database.prepare('INSERT INTO adoption_listings(data,owner_token_hash) VALUES(?,?)');for(const listing of adoption)insert.run(JSON.stringify(listing),hashOwnerToken(randomBytes(32).toString('hex')))}
 if(mark.run('pet-market-demo-v1').changes){const insert=database.prepare('INSERT INTO pet_market_listings(data,owner_token_hash) VALUES(?,?)');for(const listing of market)insert.run(JSON.stringify(listing),hashOwnerToken(randomBytes(32).toString('hex')))}
 // Older local demo rows may have been serialized before their SQLite ID was added.
 for(const table of ['adoption_listings','pet_market_listings'] as const){
  const update=database.prepare(`UPDATE ${table} SET data=? WHERE id=?`);
  for(const row of database.prepare(`SELECT id,data FROM ${table}`).all()){
   const data=JSON.parse(String(row.data)) as {id?:number};
   if(!Number.isSafeInteger(data.id)){data.id=Number(row.id);update.run(JSON.stringify(data),Number(row.id))}
  }
 }
}
