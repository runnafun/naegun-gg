import { NextRequest,NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getDiscordConfig,getDiscordUser } from '@/app/lib/discord';
import { makeExchangeTicket,verifyDesktopState } from '@/app/lib/tracker-desktop-auth';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  let port:number|undefined;
  try {
    const signed=request.cookies.get('naegun_tracker_oauth')?.value;
    if(!signed) throw new Error('LOGIN_STATE_EXPIRED');
    const stored=await verifyDesktopState(signed);port=stored.port;
    const query=request.nextUrl.searchParams;
    if(query.get('state')!==stored.state || !query.get('code')) throw new Error('OAUTH_DENIED_OR_STATE_MISMATCH');
    const {clientId,clientSecret}=getDiscordConfig();
    const base=process.env.APP_URL ?? request.nextUrl.origin;
    const redirectUri=new URL('/api/tracker/desktop/callback',base).toString();
    const result=await fetch('https://discord.com/api/v10/oauth2/token',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,
        grant_type:'authorization_code',code:query.get('code')!,redirect_uri:redirectUri}),cache:'no-store',
    });
    if(!result.ok) throw new Error('DISCORD_TOKEN_EXCHANGE_FAILED');
    const token=await result.json() as {access_token?:string};
    if(!token.access_token) throw new Error('DISCORD_ACCESS_TOKEN_MISSING');
    const discordUser=await getDiscordUser(token.access_token);
    const guildId=process.env.DISCORD_GUILD_ID;
    if(!guildId) throw new Error('DISCORD_GUILD_ID_NOT_CONFIGURED');
    const guildResponse=await fetch('https://discord.com/api/v10/users/@me/guilds',{
      headers:{Authorization:`Bearer ${token.access_token}`},cache:'no-store',
    });
    if(!guildResponse.ok) throw new Error('DISCORD_GUILDS_CHECK_FAILED');
    const guilds=await guildResponse.json() as Array<{id:string}>;
    if(!Array.isArray(guilds) || !guilds.some(g=>g.id===guildId)) throw new Error('NOT_A_SERVER_MEMBER');
    // 트래커 로그인은 신규 회원을 자동 생성하지 않음
    const account=await prisma.discordAccount.findUnique({
      where:{discordUserId:discordUser.id},include:{user:{include:{riotAccount:true}}},
    });
    if(!account || account.user.status!=='ACTIVE'||!account.user.riotAccount) throw new Error('SITE_REGISTRATION_REQUIRED');
    const ticket=await makeExchangeTicket(account.userId,stored.challenge);
    const local=new URL(`http://127.0.0.1:${port}/callback`);
    local.searchParams.set('ticket',ticket);
    const response=NextResponse.redirect(local);
    response.cookies.set('naegun_tracker_oauth','',{httpOnly:true,secure:true,path:'/api/tracker/desktop',maxAge:0});
    response.headers.set('Cache-Control','no-store');return response;
  } catch(e){
    const message=e instanceof Error?e.message:'UNKNOWN_ERROR';
    if(port){const local=new URL(`http://127.0.0.1:${port}/callback`);local.searchParams.set('error',message);
      return NextResponse.redirect(local);}
    return NextResponse.json({ok:false,error:message},{status:400});
  }
}
