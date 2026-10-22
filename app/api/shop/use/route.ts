import {NextRequest,NextResponse} from 'next/server';
import {getSession} from '@/app/lib/auth';
import {equipFrame,armShopItem,submitCustomTitle} from '@/app/lib/naegun-shop-db';
export async function POST(request:NextRequest){
 const session=await getSession();if(!session)return NextResponse.json({ok:false,error:'LOGIN_REQUIRED'},{status:401});
 let body:{action?:string;itemId?:string|null;champion?:string;round?:number;title?:string};
 try{body=await request.json()}catch{return NextResponse.json({ok:false,error:'INVALID_JSON'},{status:400})}
 try{
  if(body.action==='EQUIP')return NextResponse.json(await equipFrame(session.userId,body.itemId??null));
  if(!body.itemId)return NextResponse.json({ok:false,error:'ITEM_ID_REQUIRED'},{status:400});
  if(body.action==='ARM'||body.action==='DISARM')return NextResponse.json(await armShopItem(session.userId,body.itemId,body.action,{champion:body.champion,round:body.round}));
  if(body.action==='TITLE')return NextResponse.json(await submitCustomTitle(session.userId,body.itemId,String(body.title??'')));
  return NextResponse.json({ok:false,error:'INVALID_ACTION'},{status:400});
 }catch(e){const error=e instanceof Error?e.message:'UNKNOWN';console.warn('SHOP_USE',error);return NextResponse.json({ok:false,error},{status:409})}
}
