import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isValidBotRequest } from "@/app/lib/bot-auth";
import { getRank } from "@/app/lib/ranked-rewards";
export const dynamic="force-dynamic";
const unauthorized=()=>NextResponse.json({ok:false,error:"UNAUTHORIZED"},{status:401});
type RecordEntry={userId:string;discordUserId:string};
type Settlement={participants?:RecordEntry[]};
type Ack={settlementLogId?:string;userId?:string};

export async function GET(request:NextRequest){
  if(!isValidBotRequest(request))return unauthorized();
  if(request.nextUrl.searchParams.get("all")==="1"){
    const cursor=request.nextUrl.searchParams.get("cursor");
    const accounts=await prisma.discordAccount.findMany({
      where:{user:{status:"ACTIVE"}},orderBy:{id:"asc"},take:101,
      ...(cursor?{cursor:{id:cursor},skip:1}:{}),
      select:{id:true,discordUserId:true,user:{select:{stats:{select:{tierScore:true}}}}},
    });
    const page=accounts.slice(0,100);
    return NextResponse.json({ok:true,updates:page.map(a=>({discordUserId:a.discordUserId,
      rank:getRank(a.user.stats?.tierScore??0).rank})),
      nextCursor:accounts.length>100?page.at(-1)!.id:null},{headers:{"Cache-Control":"no-store"}});
  }
  const settlements=await prisma.adminAuditLog.findMany({
    where:{action:"RANKED_SETTLED",targetType:"Scrim"},orderBy:{createdAt:"desc"},take:200,
    select:{id:true,targetId:true,afterData:true},
  });
  if(!settlements.length)return NextResponse.json({ok:true,updates:[]});
  const targetIds=[...new Set(settlements.map(s=>s.targetId).filter((s):s is string=>!!s))];
  const acks=await prisma.adminAuditLog.findMany({where:{action:"RANKED_ROLE_SYNCED",targetType:"Scrim",
    targetId:{in:targetIds}},select:{afterData:true},orderBy:{createdAt:"desc"},take:2500});
  const acked=new Set(acks.map(a=>{const row=a.afterData as Ack|null;
    return `${row?.settlementLogId??""}:${row?.userId??""}`;}));
  const pending=settlements.flatMap(s=>{
    const data=s.afterData as Settlement|null;
    return (data?.participants??[]).filter(p=>p.userId && p.discordUserId && !acked.has(`${s.id}:${p.userId}`))
      .map(p=>({settlementLogId:s.id,scrimId:s.targetId,userId:p.userId,discordUserId:p.discordUserId}));
  }).slice(0,50);
  const ids=[...new Set(pending.map(p=>p.userId))];
  const stats=await prisma.userStats.findMany({where:{userId:{in:ids}},select:{userId:true,tierScore:true}});
  const scores=new Map(stats.map(s=>[s.userId,s.tierScore]));
  return NextResponse.json({ok:true,updates:pending.map(p=>({...p,rank:getRank(scores.get(p.userId)??0).rank}))},
    {headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:NextRequest){
  if(!isValidBotRequest(request))return unauthorized();
  let body:{settlementLogId?:string;userId?:string;discordUserId?:string};
  try{body=await request.json()}catch{return NextResponse.json({error:"INVALID_JSON"},{status:400})}
  if(!body.settlementLogId||!body.userId||!body.discordUserId)return NextResponse.json({error:"INVALID_ACK"},{status:400});
  const settlement=await prisma.adminAuditLog.findFirst({where:{id:body.settlementLogId,action:"RANKED_SETTLED"},
    select:{targetId:true,afterData:true}});
  const data=settlement?.afterData as Settlement|null;
  if(!settlement||!(data?.participants??[]).some(p=>p.userId===body.userId&&p.discordUserId===body.discordUserId))
    return NextResponse.json({error:"UNKNOWN_SETTLEMENT_MEMBER"},{status:404});
  // 중복 ACK는 해롭지 않음. GET은 settlementLogId/userId 조합으로 중복을 숨김.
  await prisma.adminAuditLog.create({data:{action:"RANKED_ROLE_SYNCED",targetType:"Scrim",targetId:settlement.targetId,
    reason:"Discord rank role synchronized",afterData:{settlementLogId:body.settlementLogId,userId:body.userId,
      discordUserId:body.discordUserId}}});
  return NextResponse.json({ok:true});
}
