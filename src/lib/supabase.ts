import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function supabase() {
  const store = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configure Supabase in .env.local (see README).');
  return createServerClient(url,key,{
    cookies:{ getAll(){return store.getAll()}, setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server Component cannot set cookies; actions can. */}} }
  });
}
