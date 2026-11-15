'use client';
import {Search,MapPin,ArrowUpRight,PawPrint,Check,SlidersHorizontal,UserRound} from 'lucide-react';
import {photo} from '../lib/data';
import BreedChoice from './breed-choice';
import CityAutocomplete from './city-autocomplete';

export default function PetSearch({type,setType,query,setQuery,location,setLocation,gender,setGender,discover}:{type:string;setType:(v:string)=>void;query:string;setQuery:(v:string)=>void;location:string;setLocation:(v:string)=>void;gender:string;setGender:(v:string)=>void;discover:()=>void}){
 const petTypes=[{value:'All pets',title:'All pets',subtitle:'Dogs & cats',image:'photo-1450778869180-41d0601e046e'},{value:'Dog',title:'Dogs',subtitle:'Dog mating profiles',image:'photo-1543466835-00a7907e9de1'},{value:'Cat',title:'Cats',subtitle:'Cat mating profiles',image:'photo-1573865526739-10659fec78a5'}];
 return <section className="pet-search-panel" aria-labelledby="pet-search-title">
  <div className="pet-search-top"><div><span className="search-eyebrow">FIND A MATING PARTNER</span><h2 id="pet-search-title">A considered search. A better beginning.</h2></div><span className="search-side-note"><PawPrint size={17}/> Breed. Gender. Location. Start with the essentials.</span></div>
  <form onSubmit={event=>{event.preventDefault();discover()}}>
   <div className="pet-type-options" role="group" aria-label="Pet type">{petTypes.map(item=><button type="button" key={item.value} className={'pet-type-option '+(type===item.value?'is-selected':'')} aria-pressed={type===item.value} onClick={()=>setType(item.value)}><img src={photo(item.image,180)} alt="" loading="lazy"/><span><b>{item.title}</b><small>{item.subtitle}</small></span><span className="pet-type-check" aria-hidden="true">{type===item.value&&<Check size={13}/>}</span></button>)}</div>
   <div className="pet-search-fields">
    <div className="search-input-box"><SlidersHorizontal size={20}/><span><b>Preferred breed</b><BreedChoice value={query} onChange={setQuery} type={type} anyLabel="Any breed" manualLabel="Or type a breed"/></span></div>
    <div className="search-input-box"><MapPin size={21}/><span><b>In your neighbourhood</b><CityAutocomplete value={location} onChange={setLocation} ariaLabel="Search by city" placeholder="Type a city, e.g. Tuticorin"/></span></div>
    <label className="search-input-box"><UserRound size={20}/><span><b>Looking for</b><select aria-label="Preferred gender" value={gender} onChange={event=>setGender(event.target.value)}><option value="All">Male or female</option><option value="Male">Male</option><option value="Female">Female</option></select></span></label>
    <button className="button pet-search-submit" type="submit"><Search size={19}/><span>Find a mate</span><ArrowUpRight size={19}/></button>
   </div>
   <p className="pet-search-note">Choose from popular breeds or type any breed. City suggestions standardise spelling; exact addresses are never needed.</p>
  </form>
 </section>
}
