import crypto from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { getDiscordConfig } from '@/app/lib/discord';
import { signDesktopState,validPort,validChallenge } from '@/app/lib/tracker-desktop-auth';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  const port=Number(request.nextUrl.searchParams.get('port'));
  const challenge=request.nextUrl.searchParams.get('challenge')??'';
  if(!validPort(port)||!validChallenge(challenge)) return NextResponse.json({error:'INVALID_OAUTH_PARAMETERS'},{status:400});
  const state=crypto.randomBytes(32).toString('hex');
  const {clientId}=getDiscordConfig();
  const base=process.env.APP_URL ?? request.nextUrl.origin;
  const redirectUri=new URL('/api/tracker/desktop/callback',base).toString();
  const discord=new URL('https://discord.com/oauth2/authorize');
  discord.searchParams.set('client_id',clientId);
  discord.searchParams.set('response_type','code');
  discord.searchParams.set('redirect_uri',redirectUri);
  discord.searchParams.set('scope','identify guilds');
  discord.searchParams.set('state',state);
  const response=NextResponse.redirect(discord);
  response.cookies.set('naegun_tracker_oauth',await signDesktopState({state,challenge,port}),{
    httpOnly:true,secure:true,sameSite:'lax',path:'/api/tracker/desktop',maxAge:600,
  });
  response.headers.set('Cache-Control','no-store');
  return response;
}
