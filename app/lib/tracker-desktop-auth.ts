import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/app/lib/prisma';

function secret() {
  if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET missing');
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}
export function pkceChallenge(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
export function validChallenge(c: string) {return /^[A-Za-z0-9_-]{43}$/.test(c);}
export function validPort(n: number) {return Number.isInteger(n) && n >= 1024 && n <= 65535;}
export async function signDesktopState(params:{port:number;challenge:string;state:string}) {
  return new SignJWT({port:params.port, challenge:params.challenge})
    .setProtectedHeader({alg:'HS256'}).setAudience('tracker-desktop-state')
    .setSubject(params.state).setIssuedAt().setExpirationTime('10m').sign(secret());
}
export async function verifyDesktopState(token:string) {
  const {payload}=await jwtVerify(token,secret(),{audience:'tracker-desktop-state'});
  const port=Number(payload.port), challenge=String(payload.challenge??''), state=String(payload.sub??'');
  if(!validPort(port) || !validChallenge(challenge) || !/^[a-f0-9]{64}$/.test(state)) throw new Error('INVALID_STATE');
  return {port,challenge,state};
}
export async function makeExchangeTicket(userId:string,challenge:string) {
  return new SignJWT({challenge}).setProtectedHeader({alg:'HS256'})
    .setSubject(userId).setAudience('tracker-desktop-exchange')
    .setIssuedAt().setExpirationTime('90s').setJti(crypto.randomUUID()).sign(secret());
}
export async function exchangeTicket(ticket:string,verifier:string) {
  const {payload}=await jwtVerify(ticket,secret(),{audience:'tracker-desktop-exchange'});
  if(typeof payload.sub!=='string' || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier) ||
    pkceChallenge(verifier)!==payload.challenge) throw new Error('INVALID_EXCHANGE');
  return payload.sub;
}
export async function signTrackerAccess(userId:string) {
  return new SignJWT({scope:'tracker:read tracker:submit'})
    .setProtectedHeader({alg:'HS256'}).setSubject(userId)
    .setAudience('naegun-tracker').setIssuedAt().setExpirationTime('4h')
    .setJti(crypto.randomUUID()).sign(secret());
}
export async function getTrackerPrincipal(request:Request) {
  try {
    const authorization=request.headers.get('authorization')??'';
    if(!authorization.startsWith('Bearer ')) return null;
    const {payload}=await jwtVerify(authorization.slice(7),secret(),{audience:'naegun-tracker'});
    if(typeof payload.sub!=='string' || payload.scope!=='tracker:read tracker:submit') return null;
    const user=await prisma.user.findUnique({where:{id:payload.sub},include:{discordAccount:true,riotAccount:true}});
    if(!user || user.status!=='ACTIVE' || !user.discordAccount || !user.riotAccount) return null;
    return {userId:user.id,discordUserId:user.discordAccount.discordUserId,
      riotId:`${user.riotAccount.gameName}#${user.riotAccount.tagLine}`};
  } catch {return null;}
}
export async function verifyTrackerRequest(request: Request, _scrimId: string) {
  // The OAuth login already verifies guild membership; getTrackerPrincipal verifies
  // that the user remains an ACTIVE site member with Discord + Riot linked.
  // Viewing the finalized 10-player roster does NOT require being a participant.
  return (await getTrackerPrincipal(request)) !== null;
}
