import {NextRequest,NextResponse} from 'next/server';
import {isValidBotRequest} from '@/app/lib/bot-auth';
import {getNoBanNotices} from '@/app/lib/naegun-shop-db';
export async function GET(req:NextRequest,{params}:{params:Promise<{code:string}>}){
 if(!isValidBotRequest(req))return NextResponse.json({ok:false,error:'UNAUTHORIZED'},{status:401});
 const {code}=await params;return NextResponse.json({ok:true,notices:await getNoBanNotices(code.toUpperCase())});
}
