'use client';
import {useSearchParams} from 'next/navigation';
import Marketplace from '../components/marketplace';
import type {Catalog} from '../lib/catalog-types';
import {installPreview} from './client-runtime';
export default function ClientPreview({catalog,initialView}:{catalog:Catalog;initialView?:string}){installPreview(catalog);const search=useSearchParams();const requested=search.get('view')||'home';const view=initialView||(['discover','adoption','marketplace','plans','how','safety','privacy','terms','contact','matches'].includes(requested)?requested:'home');return <div className="preview-shell"><div className="client-preview-notice"><b>Client UI preview</b><span>Explore pet profiles, adoption and Buy & Sell. Changes stay in this browser preview; no real listings or seller messages are sent.</span></div><Marketplace initialCatalog={catalog} initialView={view} ownerToken={search.get('owner')||''}/></div>}
