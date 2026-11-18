'use client';
import { ArrowRight, PawPrint, Store, X } from 'lucide-react';
import '../app/breeder.css';

export default function JoinChooser({ close, joinOwner, joinBreeder }: { close: () => void; joinOwner: () => void; joinBreeder: () => void }) {
  return <div className="overlay breeder-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="join-chooser" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <button className="close" onClick={close} aria-label="Close join choices"><X /></button>
      <span className="breeder-kicker"><PawPrint size={16}/> MEANINGFUL PET CONNECTIONS</span>
      <h1 id="join-title">Welcome to Petzo</h1>
      <p className="join-subtitle">Choose how you want to join our pet community</p>
      <div className="join-options">
        <article className="join-card">
          <div className="join-card-photo owner-photo"><img src="/pets/photo-1543466835-00a7907e9de1.jpg" alt="A friendly dog"/><img src="/pets/photo-1514888286974-6c03e2ca1dba.jpg" alt="A curious cat"/></div>
          <h2>Pet Owner</h2><p>Find thoughtful matches for your pet</p>
          <button className="join-owner-button" onClick={joinOwner}>Join Free <ArrowRight size={17}/></button>
        </article>
        <article className="join-card breeder-choice">
          <div className="join-card-photo"><img src="/pets/photo-1552053831-71594a27632d.jpg" alt="A dog ready to meet its next family"/></div>
          <h2>Breeder</h2><p>Manage your breeding business and pet profiles</p>
          <button className="join-breeder-button" onClick={joinBreeder}><Store size={17}/> Join as Breeder <ArrowRight size={17}/></button>
        </article>
      </div>
      <small className="join-footnote">Create a free profile first. Choose a paid plan only when you need seller listings or owner contacts.</small>
    </section>
  </div>;
}
