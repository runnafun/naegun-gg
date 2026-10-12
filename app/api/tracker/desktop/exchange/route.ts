import { NextRequest,NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { exchangeTicket,signTrackerAccess } from '@/app/lib/tracker-desktop-auth';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
  try {
    const body=await request.json() as {ticket?:string;verifier?:string};
    if(typeof body.ticket!=='string'||typeof body.verifier!=='string'||body.ticket.length>4096)
      return NextResponse.json({error:'INVALID_REQUEST'},{status:400});
    const userId=await exchangeTicket(body.ticket,body.verifier);
    const user=await prisma.user.findUnique({where:{id:userId},include:{discordAccount:true,riotAccount:true}});
    if(!user||user.status!=='ACTIVE'||!user.discordAccount||!user.riotAccount)
      return NextResponse.json({error:'REGISTRATION_REQUIRED'},{status:403});
    return NextResponse.json({ok:true,accessToken:await signTrackerAccess(userId),expiresIn:14400,
      user:{discordUserId:user.discordAccount.discordUserId,
      displayName:user.discordAccount.globalName??user.discordAccount.username,
      riotId:`${user.riotAccount.gameName}#${user.riotAccount.tagLine}`}},
      {headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'INVALID_OR_EXPIRED_LOGIN'},{status:401});}
}
