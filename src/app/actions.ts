 'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
const string=(form:FormData,key:string)=>String(form.get(key)||'').trim();
const fail=(message:string)=>redirect('/inquire?error='+encodeURIComponent(message));
export async function sendInquiry(form:FormData){
 // Honeypot, strict constraints, and server-side validation; add CAPTCHA/rate limits for public production traffic.
 if(string(form,'website')) redirect('/inquire?success=1');
 const name=string(form,'name'),email=string(form,'email'),destination=string(form,'destination');
 const date=string(form,'travel_date'),guests=Number(string(form,'guests')),message=string(form,'message');
 if(name.length<2 || name.length>120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254) fail('Enter a valid name and email.');
 if(!Number.isInteger(guests)||guests<1||guests>20 || message.length>2000) fail('Check the number of travelers or message length.');
 if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<new Date().toISOString().slice(0,10))) fail('Choose a future travel date.');
 const db=await supabase();
 if(destination){const {data}=await db.from('destinations').select('slug').eq('slug',destination).eq('published',true).maybeSingle();if(!data)fail('Choose a valid destination.');}
 const {error}=await db.from('inquiries').insert({name,email,destination_slug:destination||null,travel_date:date||null,guests,message:message||null});
 if(error)fail('We could not save your request. Please try again.');
 redirect('/inquire?success=1');
}
export async function adminLogin(form:FormData){
 const db=await supabase();const {error}=await db.auth.signInWithPassword({email:string(form,'email'),password:string(form,'password')});
 if(error)redirect('/admin/login?error=credentials');
 const {data:{user}}=await db.auth.getUser();
 const {data:role}=await db.from('admin_users').select('user_id').eq('user_id',user?.id||'').maybeSingle();
 if(!role){await db.auth.signOut();redirect('/admin/login?error=access');}
 redirect('/admin');
}
export async function adminLogout(){const db=await supabase();await db.auth.signOut();redirect('/admin/login');}
export async function updateInquiry(form:FormData){
 const {db}=await requireAdmin();const id=string(form,'id'),status=string(form,'status');
 if(!['new','contacted','confirmed','closed'].includes(status)) throw new Error('Invalid inquiry status');
 const {error}=await db.from('inquiries').update({status}).eq('id',id);if(error)throw new Error(error.message);
 revalidatePath('/admin');redirect('/admin?updated=1');
}
export async function saveDestination(form:FormData){
 const {db}=await requireAdmin();const original=string(form,'original_slug');
 const slug=string(form,'slug').toLowerCase(),name=string(form,'name');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||name.length<2)throw new Error('Invalid slug/name');
 const category=string(form,'category');if(!['Coast','Mountains','Culture','Nature'].includes(category))throw new Error('Invalid category');
 const highlights=string(form,'highlights').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,8);
 const fields={slug,name,country:string(form,'country'),region:string(form,'region'),category,tagline:string(form,'tagline'),description:string(form,'description'),duration:string(form,'duration'),best_time:string(form,'best_time'),highlights,published:form.get('published')==='on',sort_order:Math.max(0,Math.min(9999,Number(string(form,'sort_order'))||0))};
 if(Object.values(fields).some(v=>typeof v==='string'&&v.length>2500))throw new Error('Field too long');
 let error;
 if(original){({error}=await db.from('destinations').update(fields).eq('slug',original));}
 else {({error}=await db.from('destinations').insert(fields));}
 if(error)throw new Error(error.message);
 revalidatePath('/');revalidatePath('/admin');revalidatePath('/destinations/[slug]','page');
 redirect('/admin?saved=1');
}
export async function uploadPhoto(form:FormData){
 const {db}=await requireAdmin();const slug=string(form,'slug');
 const file=form.get('photo');if(!(file instanceof File)||file.size===0||file.size>5*1024*1024)throw new Error('Choose an image below 5MB');
 const allowed:{[key:string]:string}={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
 if(!allowed[file.type])throw new Error('Only JPG, PNG, WebP or AVIF');
 const {data:dest}=await db.from('destinations').select('slug').eq('slug',slug).maybeSingle();if(!dest)throw new Error('Destination not found');
 const path=`${slug}/${crypto.randomUUID()}.${allowed[file.type]}`;
 const {error:storageError}=await db.storage.from('destination-images').upload(path,file,{contentType:file.type,upsert:false});
 if(storageError)throw new Error(storageError.message);
 const {data:{publicUrl}}=db.storage.from('destination-images').getPublicUrl(path);
 const {error}=await db.from('destinations').update({photo_url:publicUrl}).eq('slug',slug);
 if(error){await db.storage.from('destination-images').remove([path]);throw new Error(error.message);}
 revalidatePath('/');revalidatePath('/admin');revalidatePath('/destinations/[slug]','page');redirect('/admin?uploaded=1');
}
