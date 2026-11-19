'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';
import { manualBirthDate } from '../lib/discovery';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function BirthDateInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [mode, setMode] = useState<'calendar' | 'manual'>('calendar');
  const [typed, setTyped] = useState('');
  const today = new Date();
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const years = useMemo(() => Array.from({ length: today.getFullYear() - 1899 }, (_, i) => today.getFullYear() - i), [today]);
  const dayCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const days = [...Array(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, i) => i + 1)];
  const iso = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const changeMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  return <div className="birth-date-field">
    <div className="birth-date-heading">
      <label htmlFor="pet-birth-date">Date of birth</label>
      <div>
        <button type="button" className={mode === 'calendar' ? 'chosen' : ''} onClick={() => setMode('calendar')}><CalendarDays size={13} />Calendar</button>
        <button type="button" className={mode === 'manual' ? 'chosen' : ''} onClick={() => { setTyped(value ? value.split('-').reverse().join('/') : ''); setMode('manual'); }}><Keyboard size={13} />Type date</button>
      </div>
    </div>
    {mode === 'calendar' ? <div className="birth-date-calendar" aria-label="Choose birth date">
      <div className="birth-date-month-year">
        <button type="button" aria-label="Previous month" disabled={viewYear === 1900 && viewMonth === 0} onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button>
        <select aria-label="Birth month" value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}>{monthNames.map((month, i) => <option key={month} value={i}>{month}</option>)}</select>
        <select aria-label="Birth year" value={viewYear} onChange={e => setViewYear(Number(e.target.value))}>{years.map(year => <option key={year} value={year}>{year}</option>)}</select>
        <button type="button" aria-label="Next month" disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()} onClick={() => changeMonth(1)}><ChevronRight size={17} /></button>
      </div>
      <div className="birth-date-day-grid" role="grid" aria-label={`${monthNames[viewMonth]} ${viewYear}`}>
        {weekdays.map(day => <span key={day} className="weekday" role="columnheader">{day}</span>)}
        {days.map((day, i) => day ? <button key={i} type="button" role="gridcell" aria-label={`${monthNames[viewMonth]} ${day}, ${viewYear}`} aria-pressed={value === iso(day)} disabled={iso(day) > today.toISOString().slice(0, 10)} className={value === iso(day) ? 'selected' : ''} onClick={() => onChange(iso(day))}>{day}</button> : <span key={`blank-${i}`} aria-hidden="true" />)}
      </div>
    </div> : <input id="pet-birth-date" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={typed} onChange={e => { setTyped(e.target.value); onChange(manualBirthDate(e.target.value)); }} aria-invalid={!!error} />}
    <small>Select the birth month and year, then choose a day. Age fills automatically.</small>
    {error && <small className="field-error" role="alert">{error}</small>}
  </div>;
}
