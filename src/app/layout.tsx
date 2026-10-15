import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:{default:'Wanderline — For the wonder of it',template:'%s | Wanderline'},description:'Considered journeys and extraordinary places. Discover the luxury editorial Wanderline travel experience.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
