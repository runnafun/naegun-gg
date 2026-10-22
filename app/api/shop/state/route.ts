import {NextResponse} from 'next/server';
import {getSession} from '@/app/lib/auth';
import {getShopState} from '@/app/lib/naegun-shop-db';
export const dynamic='force-dynamic';
export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({ok:false,error:'LOGIN_REQUIRED'},{status:401});
 try{return NextResponse.json({ok:true,...await getShopState(user.userId)},{headers:{'Cache-Control':'no-store'}})}
 catch(error){console.error('SHOP_STATE',error);return NextResponse.json({ok:false,error:'SHOP_STATE_FAILED'},{status:500})}
}
