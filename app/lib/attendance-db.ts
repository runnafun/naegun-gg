// NAEGUN_ATTENDANCE_V1: Atomic claims, wallet ledger, owned item inventory.
import {prisma} from '@/app/lib/prisma';
import {randomUUID} from 'node:crypto';
import {ATTENDANCE_DEFAULT,validAttendanceReward,kstToday,type AttendanceReward} from './attendance-config';
export type AttendanceSetRow={id:string;title:string;startDate:string;status:string;createdAt:Date};
export type RewardRow=AttendanceReward&{setId:string};
type ClaimRow={day:number;createdAt:Date};
// SQL KST clock, independent of the EC2 server timezone.
const todaySQL=()=>prisma.$queryRaw<{today:string}[]>`SELECT (NOW() AT TIME ZONE 'Asia/Seoul')::date::text AS today`;
export async function getAttendancePublic(userId:string|null){
 const sets=await prisma.$queryRaw<AttendanceSetRow[]>`
 SELECT "id","title","startDate"::text AS "startDate","status","createdAt"
 FROM "NgAttendanceSet"
 WHERE "status"='PUBLISHED' AND "startDate"<=(NOW() AT TIME ZONE 'Asia/Seoul')::date
 AND "startDate"+14>(NOW() AT TIME ZONE 'Asia/Seoul')::date
 ORDER BY "startDate" DESC LIMIT 1`;
 if(!sets.length)return {ok:true,active:false,message:'출석체크가 없습니다',today:kstToday(),rewards:[],claimed:[],day:0};
 const set=sets[0];
 const [rewards,claims,days]=await Promise.all([
  prisma.$queryRaw<RewardRow[]>`SELECT "setId","day","kind","sku","amount","label","icon","iconScale" FROM "NgAttendanceReward" WHERE "setId"=${set.id} ORDER BY "day"`,
  userId?prisma.$queryRaw<ClaimRow[]>`SELECT "day","createdAt" FROM "NgAttendanceClaim" WHERE "setId"=${set.id} AND "userId"=${userId}`:Promise.resolve([] as ClaimRow[]),
  prisma.$queryRaw<{day:number;today:string}[]>`SELECT (NOW() AT TIME ZONE 'Asia/Seoul')::date-("startDate") AS "day",(NOW() AT TIME ZONE 'Asia/Seoul')::date::text AS "today" FROM "NgAttendanceSet" WHERE "id"=${set.id}`
 ]);
 return {ok:true,active:true,set:{id:set.id,title:set.title,startDate:set.startDate},today:days[0]?.today??kstToday(),day:(days[0]?.day??0)+1,rewards,claimed:claims.map(c=>c.day),loggedIn:!!userId};
}
export async function claimAttendance(userId:string){
 return prisma.$transaction(async tx=>{
  // Serialize same account's claims and guarantee reward+claim+ledger commit together.
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
  const sets=await tx.$queryRaw<AttendanceSetRow[]>`
  SELECT "id","title","startDate"::text AS "startDate","status","createdAt"
  FROM "NgAttendanceSet" WHERE "status"='PUBLISHED'
  AND "startDate"<=(NOW() AT TIME ZONE 'Asia/Seoul')::date
  AND "startDate"+14>(NOW() AT TIME ZONE 'Asia/Seoul')::date
  ORDER BY "startDate" DESC LIMIT 1`;
  const set=sets[0];if(!set)throw Error('NO_ACTIVE_ATTENDANCE');
  const dateRows=await tx.$queryRaw<{day:number;date:string}[]>`
  SELECT ((NOW() AT TIME ZONE 'Asia/Seoul')::date-"startDate")+1 AS "day",
  (NOW() AT TIME ZONE 'Asia/Seoul')::date::text AS "date" FROM "NgAttendanceSet" WHERE "id"=${set.id}`;
  const {day,date}=dateRows[0];if(day<1||day>14)throw Error('ATTENDANCE_EXPIRED');
  const items=await tx.$queryRaw<RewardRow[]>`SELECT * FROM "NgAttendanceReward" WHERE "setId"=${set.id} AND "day"=${day}`;
  const item=items[0];if(!item||!validAttendanceReward(item))throw Error('INVALID_ATTENDANCE_REWARD');
  const existing=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "NgAttendanceClaim" WHERE "userId"=${userId} AND "setId"=${set.id} AND "day"=${day}`;
  if(existing.length)throw Error('ALREADY_CLAIMED');
  // Prevent granting to a deactivated account even if its cookie remains valid.
  const u=await tx.user.findUnique({where:{id:userId},select:{status:true}});
  if(u?.status!=='ACTIVE')throw Error('USER_NOT_ACTIVE');
  const id=randomUUID();
  await tx.$executeRaw`INSERT INTO "NgAttendanceClaim"("id","setId","userId","day","claimedKstDate") VALUES (${id},${set.id},${userId},${day},${date}::date)`;
  if(item.kind==='COIN'){
   await tx.wallet.upsert({where:{userId},create:{userId,balance:BigInt(item.amount)},update:{balance:{increment:BigInt(item.amount)}}});
   await tx.walletTransaction.create({data:{userId,amount:BigInt(item.amount),type:'EVENT_REWARD',description:`출석체크 ${set.title} ${day}일: ${item.label}`,idempotencyKey:`NG_ATTENDANCE:${set.id}:${userId}:${day}`}});
  }else{
   if(!item.sku||!['rank-shield','rank-double','no-ban','choice-low'].includes(item.sku))throw Error('UNSUPPORTED_ATTENDANCE_ITEM');
   const itemId=randomUUID();
   await tx.$executeRaw`INSERT INTO "NgShopItem"("id","userId","sku","status") VALUES (${itemId},${userId},${item.sku},'AVAILABLE')`;
  }
  return {ok:true,day,reward:item.label,balanceChange:item.kind==='COIN'?item.amount:0};
 },{maxWait:10000,timeout:20000});
}
export async function getAttendanceAdmin(){
 const [sets,rewards,counts]=await Promise.all([
  prisma.$queryRaw<AttendanceSetRow[]>`SELECT "id","title","startDate"::text AS "startDate","status","createdAt" FROM "NgAttendanceSet" ORDER BY "createdAt" DESC LIMIT 30`,
  prisma.$queryRaw<RewardRow[]>`SELECT * FROM "NgAttendanceReward" WHERE "setId" IN (SELECT "id" FROM "NgAttendanceSet" ORDER BY "createdAt" DESC LIMIT 30) ORDER BY "day"`,
  prisma.$queryRaw<{setId:string;total:number}[]>`SELECT "setId",COUNT(*)::int AS "total" FROM "NgAttendanceClaim" GROUP BY "setId"`,
 ]);
 return {ok:true,sets:sets.map(s=>({...s,rewards:rewards.filter(r=>r.setId===s.id),claims:counts.find(x=>x.setId===s.id)?.total??0})),today:(await todaySQL())[0].today};
}
export async function attendanceAdminAction(userId:string,data:{action?:string;title?:string;startDate?:string;id?:string;rewards?:AttendanceReward[]}){
 if(data.action==='CREATE'){
  const title=String(data.title??'').trim();
  const date=String(data.startDate??'');
  if(title.length<2||title.length>60||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('INVALID_SET_INFO');
  const id=randomUUID();
  await prisma.$transaction(async tx=>{
   await tx.$executeRaw`INSERT INTO "NgAttendanceSet"("id","title","startDate","createdBy") VALUES (${id},${title},${date}::date,${userId})`;
   for(const r of ATTENDANCE_DEFAULT)await tx.$executeRaw`INSERT INTO "NgAttendanceReward"("setId","day","kind","sku","amount","label","icon","iconScale") VALUES (${id},${r.day},${r.kind},${r.sku},${r.amount},${r.label},${r.icon},${r.iconScale})`;
  });return {ok:true,id};
 }
 if(!data.id)throw Error('SET_ID_REQUIRED');
 return prisma.$transaction(async tx=>{
  // Cross-admin create/publish protection.
  await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtext('NG_ATTENDANCE_PUBLISH_V1'))`;
  const rows=await tx.$queryRaw<AttendanceSetRow[]>`SELECT "id","title","startDate"::text AS "startDate","status","createdAt" FROM "NgAttendanceSet" WHERE "id"=${data.id} FOR UPDATE`;
  const set=rows[0];if(!set)throw Error('SET_NOT_FOUND');
  if(data.action==='SAVE'){
   if(set.status!=='DRAFT')throw Error('PUBLISHED_SET_LOCKED');
   const rewards=data.rewards;
   if(!Array.isArray(rewards)||rewards.length!==14||new Set(rewards.map(r=>r.day)).size!==14||!rewards.every(validAttendanceReward))throw Error('INVALID_REWARD_CONFIG');
   for(const r of rewards)await tx.$executeRaw`UPDATE "NgAttendanceReward" SET "kind"=${r.kind},"sku"=${r.sku},"amount"=${r.amount},"label"=${r.label},"icon"=${r.icon},"iconScale"=${r.iconScale} WHERE "setId"=${set.id} AND "day"=${r.day}`;
  }else if(data.action==='PUBLISH'){
   if(set.status!=='DRAFT')throw Error('SET_NOT_DRAFT');
   const now=(await tx.$queryRaw<{today:string}[]>`SELECT (NOW() AT TIME ZONE 'Asia/Seoul')::date::text AS "today"`)[0].today;
   if(set.startDate<now)throw Error('PAST_START_DATE');
   const count=(await tx.$queryRaw<{total:number}[]>`SELECT COUNT(*)::int AS total FROM "NgAttendanceReward" WHERE "setId"=${set.id}`)[0].total;
   if(count!==14)throw Error('NEED_14_REWARDS');
   const overlap=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "NgAttendanceSet" WHERE "id"<>${set.id} AND "status"='PUBLISHED' AND "startDate" < (${set.startDate}::date + 14) AND ("startDate" + 14) > ${set.startDate}::date LIMIT 1`;
   if(overlap.length)throw Error('OVERLAPPING_PUBLISHED_SET');
   await tx.$executeRaw`UPDATE "NgAttendanceSet" SET "status"='PUBLISHED',"updatedAt"=NOW() WHERE "id"=${set.id}`;
  }else if(data.action==='CLOSE'){
   if(set.status!=='PUBLISHED')throw Error('SET_NOT_PUBLISHED');
   await tx.$executeRaw`UPDATE "NgAttendanceSet" SET "status"='CLOSED',"updatedAt"=NOW() WHERE "id"=${set.id}`;
  }else throw Error('UNKNOWN_ACTION');
  await tx.adminAuditLog.create({data:{adminId:userId,action:'ATTENDANCE_'+data.action,targetType:'AttendanceSet',targetId:set.id,reason:set.title}});
  return {ok:true,id:set.id};
 },{maxWait:10000,timeout:30000});
}
export async function redeemFrameChoice(userId:string,itemId:string,frameSku:string){
 if(!['frame-5','frame-6','frame-7','frame-8','frame-9'].includes(frameSku))throw Error('LOW_FRAME_ONLY');
 return prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
  const item=await tx.$queryRaw<{id:string;status:string}[]>`SELECT "id","status" FROM "NgShopItem" WHERE "id"=${itemId} AND "userId"=${userId} AND "sku"='choice-low' FOR UPDATE`;
  if(item[0]?.status!=='AVAILABLE')throw Error('CHOICE_TICKET_NOT_AVAILABLE');
  const owned=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "NgShopItem" WHERE "userId"=${userId} AND "sku"=${frameSku} LIMIT 1`;
  if(owned.length)throw Error('FRAME_ALREADY_OWNED');
  const newItemId=randomUUID();
  await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='CONSUMED',"consumedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=${itemId}`;
  await tx.$executeRaw`INSERT INTO "NgShopItem"("id","userId","sku","status") VALUES (${newItemId},${userId},${frameSku},'AVAILABLE')`;
  return {ok:true,frameSku,newItemId};
 },{maxWait:10000,timeout:20000});
}
