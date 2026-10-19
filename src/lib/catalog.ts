import { supabase } from '@/lib/supabase';
import { type Destination } from '@/data/destinations';
export type CatalogDestination = Destination & { photo_url?: string | null; published?: boolean };
export async function catalog():Promise<CatalogDestination[]>{
 const db=await supabase();
 const {data,error}=await db.from('destinations').select('*').eq('published',true).order('sort_order').order('name');
 if(error) throw new Error('Could not load destinations: '+error.message);
 return (data||[]).map(d=>({slug:d.slug,name:d.name,country:d.country,region:d.region,category:d.category,image:d.image_fallback || '/images/hero.svg',tagline:d.tagline,description:d.description,duration:d.duration,bestTime:d.best_time,highlights:d.highlights || [],accent:'#d6a46d',photo_url:d.photo_url,published:d.published}));
}
export async function catalogOne(slug:string){return (await catalog()).find(d=>d.slug===slug)}
