'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Check,MapPin} from 'lucide-react';
import {canonicalCity,citySuggestions,indianCities} from '../lib/pet-search-options';
import '../app/search-controls.css';

export default function CityAutocomplete({value,onChange,defaultValue='',placeholder='Start typing a city',ariaLabel='City',name,className='',required=false}:{value?:string;onChange?:(value:string)=>void;defaultValue?:string;placeholder?:string;ariaLabel?:string;name?:string;className?:string;required?:boolean}){
 const id=useId(),input=useRef<HTMLInputElement>(null),[open,setOpen]=useState(false),[draft,setDraft]=useState(defaultValue);
 useEffect(()=>{if(value!==undefined)setDraft(value)},[value]);
 const current=value??draft;
 const update=(next:string)=>{setDraft(next);onChange?.(next)};
 const suggestions=citySuggestions(current);
 const known=indianCities.some(city=>city.name.toLocaleLowerCase()===current.trim().toLocaleLowerCase()||(city.aliases||[]).some(alias=>alias.toLocaleLowerCase()===current.trim().toLocaleLowerCase()));
 return <div className={`city-autocomplete ${className}`}>
  <input ref={input} id={id} name={name} value={current} required={required} placeholder={placeholder} aria-label={ariaLabel} aria-autocomplete="list" aria-expanded={open&&suggestions.length>0} aria-controls={`${id}-options`} autoComplete="off" onFocus={()=>setOpen(true)} onChange={event=>{update(event.target.value);setOpen(true)}} onBlur={()=>window.setTimeout(()=>setOpen(false),130)} onKeyDown={event=>{if(event.key==='Escape')setOpen(false);if(event.key==='ArrowDown'&&suggestions.length){event.preventDefault();document.getElementById(`${id}-option-0`)?.focus()}}}/>
  {open&&suggestions.length>0&&<div className="city-suggestion-list" id={`${id}-options`} role="listbox" aria-label="Suggested cities">{suggestions.map((city,index)=><button type="button" role="option" aria-selected={canonicalCity(current)===city.name} id={`${id}-option-${index}`} key={city.name} onMouseDown={event=>event.preventDefault()} onClick={()=>{update(city.name);setOpen(false);input.current?.blur()}}><MapPin size={15}/><span>{city.name}{city.aliases?.[0]&&<small>Also known as {city.aliases[0]}</small>}</span>{canonicalCity(current)===city.name&&known&&<Check size={15}/>}</button>)}</div>}
  <span className={`city-validity ${known?'known':''}`}>{known?<><Check size={12}/> City recognised</>:current.trim().length>=2?'Choose a suggestion or keep your city name':'India city suggestions · type to search'}</span>
 </div>
}
