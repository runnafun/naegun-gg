import {NextRequest,NextResponse} from 'next/server';
import {getSession} from '@/app/lib/auth';
import {buyShopItem} from '@/app/lib/naegun-shop-db';
export async function POST(request:NextRequest){
 const session=await getSession();if(!session)return NextResponse.json({ok:false,error:'LOGIN_REQUIRED'},{status:401});
 let body:{sku?:string;requestId?:string};try{body=await request.json()}catch{return NextResponse.json({ok:false,error:'INVALID_JSON'},{status:400})}
 try{return NextResponse.json(await buyShopItem(session.userId,String(body.sku??''),String(body.requestId??'')))}
 catch(e){const error=e instanceof Error?e.message:'UNKNOWN';console.warn('SHOP_PURCHASE',error);
 return NextResponse.json({ok:false,error:['INVALID_PURCHASE','FRAME_ALREADY_OWNED','INSUFFICIENT_GG_COIN'].includes(error)?error:'SHOP_PURCHASE_FAILED'},
 {status:error==='INSUFFICIENT_GG_COIN'?402:409});}
}
