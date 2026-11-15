'use client';
import {breedsFor} from '../lib/pet-search-options';
import '../app/search-controls.css';

export default function BreedChoice({value,onChange,type='All pets',anyLabel='Choose a common breed',manualLabel='Or type another breed'}:{value:string;onChange:(value:string)=>void;type?:string;anyLabel?:string;manualLabel?:string}){
 const options=breedsFor(type),selected=options.includes(value);
 return <div className="breed-choice"><select aria-label="Common breed suggestions" value={selected?value:''} onChange={event=>onChange(event.target.value)}><option value="">{anyLabel}</option>{options.map(breed=><option key={breed} value={breed}>{breed}</option>)}</select><input aria-label="Type a breed manually" value={selected?'':value} onChange={event=>onChange(event.target.value)} placeholder={manualLabel} autoComplete="off"/></div>
}
