import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
import { applyProtection } from "@/app/lib/ranked-rewards";
export const dynamic="force-dynamic";
type Operation="SHIELD_ADD"|"SHIELD_SUB"|"TICKET_ADD"|"TICKET_SUB"|"PROGRESS_ADD"|"COINS_ADD"|"COINS_SUB"|"WIN_ADD"|"LOSS_ADD";
const ops:Operation[]=["SHIELD_ADD","SHIELD_SUB","TICKET_ADD","TICKET_SUB","PROGRESS_ADD","COINS_ADD","COINS_SUB","WIN_ADD","LOSS_ADD"];
const respond=(error:string,status:number)=>NextResponse.json({ok:false,error},{status});
function sameOrigin(req:Request){const origin=req.headers.get("origin");if(!origin)return false;try{const host=new URL(origin).host;const allowed=new Set([new URL(req.url).host]);const forwarded=req.headers.get("x-forwarded-host");if(forwarded)allowed.add(forwarded.split(",")[0].trim());if(process.env.APP_URL)allowed.add(new URL(process.env.APP_URL).host);return allowed.has(host);}catch{return false;}}
export async function POST(request:Request){
 const auth=await requireAdmin(request);if(!auth.ok)return respond("ADMIN_REQUIRED",auth.status);
 if(!sameOrigin(request))return respond("INVALID_ORIGIN",403);
 let payload:{operationId?:string,userIds?:string[],operation?:Operation,amount?:number,reason?:string};
 try{payload=await request.json();}catch{return respond("INVALID_JSON",400);}
 const ids=payload.userIds;
 const op=payload.operation;
 const operationId=payload.operationId;
 if(typeof operationId!=="string"||!/^[0-9a-f-]{36}$/i.test(operationId))return respond("INVALID_OPERATION_ID",400);
 if(!op||!ops.includes(op))return respond("INVALID_OPERATION",400);
 if(!Array.isArray(ids)||ids.length<1||ids.length>30||new Set(ids).size!==ids.length||ids.some(x=>typeof x!=="string"||!/^[0-9a-f-]{36}$/i.test(x)))return respond("1~30명의 회원을 중복 없이 선택해 주세요.",400);
 const amount=["COINS_ADD","COINS_SUB","PROGRESS_ADD"].includes(op)?Number(payload.amount):1;
 if(!Number.isSafeInteger(amount)||amount<1||amount>(op==="PROGRESS_ADD"?100:100000))return respond("조정 수량이 유효하지 않습니다.",400);
 const reason=String(payload.reason??"").trim();if(reason.length<5||reason.length>200)return respond("사유를 5~200자로 입력해 주세요.",400);
 try{
   const result=await prisma.$transaction(async tx=>{
     await tx.adminAuditLog.create({data:{id:operationId,adminId:auth.user.id,action:"ADMIN_REWARD_BATCH",targetType:"User",targetId:null,reason,afterData:{status:"STARTED",operation:op,users:ids,amount}}});
     const active=await tx.user.findMany({where:{id:{in:ids},status:"ACTIVE"},select:{id:true}});
     if(active.length!==ids.length)throw new Error("등록된 활성 회원만 지급할 수 있습니다.");
     const rows=[];
     for(const userId of ids){
       const [stats,defense,wallet]=await Promise.all([
         tx.userStats.findUnique({where:{userId}}),tx.defenseStats.findUnique({where:{userId}}),tx.wallet.findUnique({where:{userId}})
       ]);
       const prev={score:stats?.tierScore??0,wins:stats?.wins??0,losses:stats?.losses??0,progress:defense?.progress??0,tickets:defense?.tickets??0,coins:String(wallet?.balance??BigInt(0))};
       let score=prev.score,wins=prev.wins,losses=prev.losses,progress=prev.progress,tickets=prev.tickets,coins=BigInt(prev.coins);
       if(op==="SHIELD_ADD")score=Math.min(102,score+1);
       if(op==="SHIELD_SUB")score=Math.max(0,score-1);
       if(op==="TICKET_ADD")tickets=Math.min(2,tickets+1);
       if(op==="TICKET_SUB")tickets=Math.max(0,tickets-1);
       if(op==="WIN_ADD")wins+=1;
       if(op==="LOSS_ADD")losses+=1;
       if(op==="PROGRESS_ADD"){const p=applyProtection(progress,tickets,amount);progress=p.progress;tickets=p.tickets;}
       if(op==="COINS_ADD")coins+=BigInt(amount);
       if(op==="COINS_SUB")coins-=BigInt(amount);
       if(coins<BigInt(0))throw new Error("일부 회원의 GG코인 잔액이 부족합니다. 전원 미처리했습니다.");
       if(score!==prev.score||wins!==prev.wins||losses!==prev.losses){await tx.userStats.upsert({where:{userId},create:{userId,tierScore:score,wins,losses},update:{tierScore:score,wins,losses}});}
       if(progress!==prev.progress||tickets!==prev.tickets){await tx.defenseStats.upsert({where:{userId},create:{userId,progress,tickets},update:{progress,tickets}});}
       if(coins!==BigInt(prev.coins)){
         const diff=coins-BigInt(prev.coins);
         await tx.wallet.upsert({where:{userId},create:{userId,balance:coins},update:{balance:{increment:diff}}});
         await tx.walletTransaction.create({data:{userId,amount:diff,type:diff>BigInt(0)?"ADMIN_GRANT":"ADMIN_DEDUCT",createdById:auth.user.id,idempotencyKey:`ADMIN_BATCH:${operationId}:${userId}`,description:reason}});
       }
       rows.push({userId,before:prev,after:{score,wins,losses,progress,tickets,coins:String(coins)}});
     }
     await tx.adminAuditLog.update({where:{id:operationId},data:{afterData:{status:"COMPLETED",operation:op,amount,users:rows}}});
     return rows;
   },{maxWait:10000,timeout:60000});
   return NextResponse.json({ok:true,updated:result.length,items:result});
 }catch(e){
   if(e&&typeof e==="object"&&"code" in e&&e.code==="P2002")return NextResponse.json({ok:true,duplicate:true,message:"이미 실행한 작업입니다. 재지급하지 않았습니다."});
   console.error("ADMIN_BATCH_REWARD",e);
   return respond(e instanceof Error?e.message:"지급 실패",409);
 }
}
