import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
export async function requireAdmin(){
 const db=await supabase();
 const {data:{user},error}=await db.auth.getUser();
 if(error || !user) redirect('/admin/login');
 const {data:role}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(!role) redirect('/admin/login?error=access');
 return {db,user};
}
