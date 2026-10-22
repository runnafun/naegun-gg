// NAEGUN_SHOP_V1 - Raw SQL, no Prisma schema generation needed.
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client';
import { randomUUID } from 'node:crypto';
import { findProduct,frameImage } from './naegun-shop-products';
export {frameImage};
export type ShopItemRow={id:string;userId:string;sku:string;status:string;scrimId:string|null;meta:unknown;createdAt:Date};
export type ShopStyleRow={userId:string;frameSku:string|null;title:string|null};
export function isAllowedSku(sku:string){return !!findProduct(sku)}
export async function getShopState(userId:string){
 // Also recovers tickets if admin force-cancelled a scrim through another endpoint.
 await prisma.$executeRaw`UPDATE "NgShopItem" i SET "status"='AVAILABLE',"scrimId"=NULL,"updatedAt"=NOW()
  WHERE i."userId"=${userId} AND i."status" IN ('ACTIVE','RESERVED')
    AND EXISTS (SELECT 1 FROM "Scrim" s WHERE s."id"=i."scrimId" AND s."status" IN ('CANCELLED','DELETED'))`;
 const [wallet,items,styles,requests] = await Promise.all([
   prisma.wallet.findUnique({where:{userId},select:{balance:true}}),
   prisma.$queryRaw<ShopItemRow[]>`SELECT * FROM "NgShopItem" WHERE "userId"=${userId} ORDER BY "createdAt" DESC`,
   prisma.$queryRaw<ShopStyleRow[]>`SELECT * FROM "NgShopStyle" WHERE "userId"=${userId}`,
   prisma.$queryRaw<{id:string;itemId:string;title:string;status:string}[]>`SELECT "id","itemId","title","status" FROM "NgShopTitleRequest" WHERE "userId"=${userId} ORDER BY "createdAt" DESC`,
 ]);
 return {balance:(wallet?.balance??BigInt(0)).toString(),items,style:styles[0]??{frameSku:null,title:null},requests};
}
export async function buyShopItem(userId:string,sku:string,requestId:string){
 const product=findProduct(sku);
 if(!product||sku==='choice-low'|| !/^[0-9a-f-]{36}$/i.test(requestId))throw Error('INVALID_PURCHASE'); // NAEGUN_ATTENDANCE_VOUCHER_PURCHASE_GUARD_V1
 const idem=`NG_SHOP:${userId}:${requestId}`;
 return prisma.$transaction(async tx=>{
   await tx.wallet.upsert({where:{userId},create:{userId,balance:BigInt(0)},update:{}});
   const buyer=await tx.user.findUnique({where:{id:userId},select:{status:true}});
   if(buyer?.status!=='ACTIVE')throw Error('USER_NOT_ACTIVE');
   // Serialize purchases by same user. No duplicate frames, even with concurrent clicks.
   await tx.$queryRaw`SELECT "userId" FROM "Wallet" WHERE "userId"=${userId} FOR UPDATE`;
   const previous=await tx.walletTransaction.findUnique({where:{idempotencyKey:idem}});
   if(previous)return {ok:true,replayed:true};
   if(product.kind==='FRAME'){
     const owns=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "NgShopItem" WHERE "userId"=${userId} AND "sku"=${sku} LIMIT 1`;
     if(owns.length)throw Error('FRAME_ALREADY_OWNED');
   }
   
   // NAEGUN_WALLET_LOCK_DIAG_V2
   const lockedWallet = await tx.wallet.findUnique({
     where: { userId },
     select: { balance: true }
   });

   if (!lockedWallet) {
     throw Error('WALLET_NOT_FOUND');
   }

   if (lockedWallet.balance < BigInt(product.price)) {
     console.warn('NG_SHOP_INSUFFICIENT_BALANCE', {
       userTail: userId.slice(-6),
       sku,
       dbBalance: lockedWallet.balance.toString(),
       price: product.price
     });

     throw Error('INSUFFICIENT_GG_COIN');
   }

   await tx.wallet.update({
     where: { userId },
     data: {
       balance: {
         decrement: BigInt(product.price)
       }
     }
   });

   const itemId=randomUUID();
   await tx.$executeRaw`INSERT INTO "NgShopItem"("id","userId","sku") VALUES (${itemId},${userId},${sku})`;
   await tx.walletTransaction.create({data:{userId,amount:BigInt(-product.price),type:'SHOP_PURCHASE',idempotencyKey:idem,
     description:`내전.GG 상점: ${product.name}`,createdById:null}});
   return {ok:true,itemId};
 },{maxWait:10000,timeout:20000});
}
export async function equipFrame(userId:string,itemId:string|null){
 return prisma.$transaction(async tx=>{
   let sku:string|null=null;
   if(itemId){
     const owned=await tx.$queryRaw<{sku:string}[]>`SELECT "sku" FROM "NgShopItem" WHERE "id"=${itemId} AND "userId"=${userId} AND "sku" LIKE 'frame-%' LIMIT 1`;
     if(!owned.length||!frameImage(owned[0].sku))throw Error('FRAME_NOT_OWNED');
     sku=owned[0].sku;
   }
   await tx.$executeRaw`INSERT INTO "NgShopStyle"("userId","frameSku") VALUES (${userId},${sku}) ON CONFLICT("userId") DO UPDATE SET "frameSku"=EXCLUDED."frameSku","updatedAt"=NOW()`;
   return {ok:true,frameSku:sku};
 });
}
export async function armShopItem(userId:string,itemId:string,action:'ARM'|'DISARM',opts?:{champion?:string;round?:number}){
 return prisma.$transaction(async tx=>{
   const owned=await tx.$queryRaw<ShopItemRow[]>`SELECT * FROM "NgShopItem" WHERE "id"=${itemId} AND "userId"=${userId} FOR UPDATE`;
   const item=owned[0];if(!item)throw Error('ITEM_NOT_OWNED');
   if(!['rank-shield','rank-double','no-ban'].includes(item.sku))throw Error('NOT_ARMABLE');
   if(action==='DISARM'){
     if(item.status!=='ARMED')throw Error('ITEM_ALREADY_RESERVED');
     await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='AVAILABLE',"meta"='{}'::jsonb,"updatedAt"=NOW() WHERE "id"=${itemId}`;
     return {ok:true};
   }
   if(item.status!=='AVAILABLE'&&item.status!=='ARMED')throw Error('ITEM_ALREADY_USED');
   let meta:Record<string,string|number>={};
   if(item.sku==='no-ban'){
     const champion=String(opts?.champion??'').trim();
     if(!/^[\p{L}\p{N} '\-.]{2,35}$/u.test(champion)||![1,2].includes(Number(opts?.round)))throw Error('INVALID_NO_BAN_SELECTION');
     meta={champion,round:Number(opts?.round)};
   }
   // One armed ticket per kind. Additional owned tickets stay available.
   await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='AVAILABLE',"updatedAt"=NOW() WHERE "userId"=${userId} AND "sku"=${item.sku} AND "status"='ARMED' AND "id"<>${itemId}`;
   await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='ARMED',"meta"=${JSON.stringify(meta)}::jsonb,"updatedAt"=NOW() WHERE "id"=${itemId}`;
   return {ok:true};
 });
}
export async function submitCustomTitle(userId:string,itemId:string,title:string){
 const value=title.trim();
 if(value.length<2||value.length>15||/[<>@\r\n]/.test(value))throw Error('INVALID_TITLE');
 return prisma.$transaction(async tx=>{
   const items=await tx.$queryRaw<ShopItemRow[]>`SELECT * FROM "NgShopItem" WHERE "id"=${itemId} AND "userId"=${userId} FOR UPDATE`;
   if(items[0]?.sku!=='custom-title'||items[0]?.status!=='AVAILABLE')throw Error('TICKET_NOT_AVAILABLE');
   const id=randomUUID();
   await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='SUBMITTED',"updatedAt"=NOW() WHERE "id"=${itemId}`;
   await tx.$executeRaw`INSERT INTO "NgShopTitleRequest"("id","userId","itemId","title") VALUES (${id},${userId},${itemId},${value})`;
   await tx.adminAuditLog.create({data:{action:'SHOP_CUSTOM_TITLE_REQUEST',targetType:'User',targetId:userId,afterData:{requestId:id,title:value}}});
   return {ok:true,requestId:id};
 });
}
export async function getFrameMap(puuids:string[]){
 if(!puuids.length)return {} as Record<string,string>;
 const unique=[...new Set(puuids)].filter(x=>typeof x==='string').slice(0,100);
 const rows=await prisma.$queryRaw<{puuid:string;frameSku:string}[]>`
  SELECT r."puuid", s."frameSku" FROM "RiotAccount" r JOIN "NgShopStyle" s ON s."userId"=r."userId"
  WHERE r."puuid" IN (${Prisma.join(unique)}) AND s."frameSku" IS NOT NULL`;
 return Object.fromEntries(rows.map(x=>[x.puuid,x.frameSku]));
}
export async function bindShopItemsToScrim(userId:string,scrimId:string){
 // Idempotent, claim only user's armed items, one per kind. For waitlisted users caller must skip.
 await prisma.$executeRaw`UPDATE "NgShopItem" SET "status"='RESERVED',"scrimId"=${scrimId},"updatedAt"=NOW()
   WHERE "userId"=${userId} AND "status"='ARMED' AND "sku" IN ('rank-shield','rank-double','no-ban')`;
}
export async function releaseShopItemsForUser(userId:string,scrimId:string){
 await prisma.$executeRaw`UPDATE "NgShopItem" SET "status"='ARMED',"scrimId"=NULL,"updatedAt"=NOW()
   WHERE "userId"=${userId} AND "scrimId"=${scrimId} AND "status"='RESERVED'`;
}
export async function closeShopItemsForScrim(scrimId:string){
 await prisma.$transaction(async tx=>{
   // Reserved by joining users; if they are no longer CONFIRMED, release them.
   await tx.$executeRaw`UPDATE "NgShopItem" i SET "status"='ARMED',"scrimId"=NULL,"updatedAt"=NOW()
     WHERE i."scrimId"=${scrimId} AND i."status"='RESERVED' AND NOT EXISTS
       (SELECT 1 FROM "ScrimParticipant" p WHERE p."scrimId"=${scrimId} AND p."userId"=i."userId" AND p."status"='CONFIRMED')`;
   // Apply any armed tickets held by confirmed users, including waitlist promotions.
   await tx.$executeRaw`UPDATE "NgShopItem" i SET "status"='RESERVED',"scrimId"=${scrimId},"updatedAt"=NOW()
     WHERE i."status"='ARMED' AND EXISTS
       (SELECT 1 FROM "ScrimParticipant" p WHERE p."scrimId"=${scrimId} AND p."userId"=i."userId" AND p."status"='CONFIRMED')`;
   await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='ACTIVE',"updatedAt"=NOW()
     WHERE "scrimId"=${scrimId} AND "status"='RESERVED'`;
 });
}
export async function releaseShopItemsForCancelledScrim(scrimId:string){
 await prisma.$executeRaw`UPDATE "NgShopItem" SET "status"='AVAILABLE',"scrimId"=NULL,"updatedAt"=NOW()
 WHERE "scrimId"=${scrimId} AND "status" IN ('ACTIVE','RESERVED')`;
}
export async function getNoBanNotices(code:string){
 const rows=await prisma.$queryRaw<{champion:string;round:number;user:string}[]>`
 SELECT i."meta"->>'champion' AS champion,(i."meta"->>'round')::int AS round,
 COALESCE(NULLIF(d."globalName",''),d."username") AS "user"
 FROM "NgShopItem" i JOIN "Scrim" s ON s."id"=i."scrimId"
 JOIN "DiscordAccount" d ON d."userId"=i."userId"
 WHERE s."code"=${code} AND i."sku"='no-ban' AND i."status"='ACTIVE'
 ORDER BY i."createdAt" ASC`;
 return rows;
}
// Called inside the same settlement transaction, after the Scrim FINISHED lock.
// No ticket can affect two settlements. A winning user's unused loss shield is returned.
export async function applyShopSettlementEffects(tx:Prisma.TransactionClient,scrimId:string,userId:string,win:boolean,oldScore:number){
 const items=await tx.$queryRaw<ShopItemRow[]>`
 SELECT * FROM "NgShopItem" WHERE "scrimId"=${scrimId} AND "userId"=${userId} AND "status"='ACTIVE' FOR UPDATE`;
 const shield=items.some(x=>x.sku==='rank-shield')&&!win&&oldScore>0;
 const double=items.some(x=>x.sku==='rank-double')&&win&&oldScore<101;
 for(const item of items){
   if((item.sku==='rank-shield'&&!shield)||(item.sku==='rank-double'&&!double)){
     await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='AVAILABLE',"scrimId"=NULL,"updatedAt"=NOW() WHERE "id"=${item.id}`;
   }else{
     await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='CONSUMED',"consumedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=${item.id}`;
   }
 }
 return {shield,double};
}
export async function getPublicStyleForPuuid(puuid:string){
 const rows=await prisma.$queryRaw<{frameSku:string|null;title:string|null}[]>`
  SELECT s."frameSku",s."title" FROM "NgShopStyle" s
  JOIN "RiotAccount" r ON r."userId"=s."userId" WHERE r."puuid"=${puuid} LIMIT 1`;
 return rows[0]??{frameSku:null,title:null};
}
