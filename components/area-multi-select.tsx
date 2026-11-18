'use client';

import { useMemo, useState } from 'react';
import { Check, MapPin, Plus, X } from 'lucide-react';
import { areasForCity } from '../lib/pet-search-options';
import '../app/search-controls.css';

export default function AreaMultiSelect({ city, value, onChange, label = 'Nearby areas', compact = false }: {
  city: string; value: string[]; onChange: (areas: string[]) => void; label?: string; compact?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const suggestions = useMemo(() => areasForCity(city), [city]);
  const add = (name: string) => {
    const area = name.trim().replace(/\s+/g, ' ');
    if (area.length < 2 || value.some(item => item.toLocaleLowerCase() === area.toLocaleLowerCase()) || value.length >= 12) return;
    onChange([...value, area]); setDraft('');
  };
  const toggle = (area: string) => onChange(value.some(item => item.toLocaleLowerCase() === area.toLocaleLowerCase()) ? value.filter(item => item.toLocaleLowerCase() !== area.toLocaleLowerCase()) : value.length < 12 ? [...value, area] : value);
  return <div className={`area-picker${compact ? ' compact' : ''}`}>
    <span className="area-picker-label"><MapPin size={14}/>{label}{city.trim() ? ` in ${city}` : ''}</span>
    {!city.trim() ? <p className="area-picker-help">Choose a city first to see nearby areas.</p> : <>
      {suggestions.length > 0 ? <div className="area-options" role="group" aria-label={`${label} in ${city}`}>
        {suggestions.map(area => <label key={area} className={value.some(item => item.toLocaleLowerCase() === area.toLocaleLowerCase()) ? 'selected' : ''}>
          <input type="checkbox" checked={value.some(item => item.toLocaleLowerCase() === area.toLocaleLowerCase())} onChange={() => toggle(area)} />
          <span>{area}</span>{value.some(item => item.toLocaleLowerCase() === area.toLocaleLowerCase()) && <Check size={14}/>}
        </label>)}
      </div> : <p className="area-picker-help">No saved area suggestions for this city. Add any locality below.</p>}
      <div className="area-add-row"><input aria-label="Add another area" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(draft); } }} placeholder="Type an area, e.g. Velachery"/><button type="button" disabled={draft.trim().length < 2 || value.length >= 12} onClick={() => add(draft)}><Plus size={15}/> Add</button></div>
      {value.length > 0 && <div className="area-chips" aria-label="Selected areas">{value.map(area => <button type="button" key={area} onClick={() => toggle(area)} aria-label={`Remove ${area}`}><span>{area}</span><X size={13}/></button>)}</div>}
      <small className="area-picker-help">Select one or more areas, or add a custom locality. Up to 12.</small>
    </>}
  </div>;
}
