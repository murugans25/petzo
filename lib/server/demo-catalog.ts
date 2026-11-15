import {pets} from '../data';
import type {Catalog} from '../catalog-types';

const updatedAt='2026-01-01T00:00:00.000Z';
export function demoCatalog():Catalog{return {
 pets:pets.map((pet,index)=>({...pet,images:[`/pets/${pet.image}.jpg`],photoTitles:{},lookingFor:['Breeding'],availability:true,description:`Meet ${pet.name}, a friendly ${pet.breed.toLowerCase()} from ${pet.location}. This illustrative profile helps preview Petzo discovery.`,health:'Sample preview only. Ask the owner for veterinary records and arrange an independent health check.',vaccination:'Not verified · sample preview',weight:0,temperament:index%2?'Calm and curious':'Playful and friendly',ownerName:'Sample owner',ownerEmail:'',sample:true})),
 settings:{announcement:'A thoughtful start for every pet connection.',heroTitle:'Their perfect match.',heroAccent:'Your next happy story.',heroDescription:'Meet compatible pets and caring pet parents, just around the corner.',contactEmail:''},
 plans:[{id:1,name:'Free',price:0,months:1,description:'Explore the community.',features:['Browse approved pet profiles','Explore basic suggestions','Save favourite pet profiles','Free adoption listings and requests'],active:true,premium:false},{id:2,name:'Premium',price:399,months:1,description:'Feature your pet and start meaningful connections.',features:['Feature your pet listing','Contact pet owners','Browse every public profile for free'],active:true,premium:true}],
 updatedAt,preview:true
}}
