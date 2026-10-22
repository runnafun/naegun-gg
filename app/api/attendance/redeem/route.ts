import {NextRequest,NextResponse} from 'next/server';
import {getSession} from '@/app/lib/auth';
import {redeemFrameChoice} from '@/app/lib/attendance-db';
export async function POST(request:NextRequest){
 const session=await getSession();if(!session)return NextResponse.json({ok:false,error:'LOGIN_REQUIRED'},{status:401});
 let input:{itemId?:string;frameSku?:string};try{input=await request.json()}catch{return NextResponse.json({ok:false,error:'INVALID_JSON'},{status:400})}
 if(typeof input.itemId!=='string'||typeof input.frameSku!=='string')return NextResponse.json({ok:false,error:'INVALID_REQUEST'},{status:400});
 try{return NextResponse.json(await redeemFrameChoice(session.userId,input.itemId,input.frameSku))}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REDEEM_FAILED'},{status:409})}
}
