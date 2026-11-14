import type { Metadata, Viewport } from 'next';
import './globals.css';
import './brand-theme.css';
import './discovery.css';
import './favourites.css';
import './readability.css';
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#621741' };
export const metadata: Metadata = { title: 'Petzo — Responsible Pet Mating Marketplace', description: 'Explore dog and cat breeding profiles by breed, gender and city. Start thoughtful, responsible conversations with other pet owners.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}





