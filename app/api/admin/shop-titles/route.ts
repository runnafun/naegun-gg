import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/app/lib/admin-auth';
import {prisma} from '@/app/lib/prisma';
export const dynamic='force-dynamic';
type Row={id:string;userId:string;itemId:string;title:string;status:string;createdAt:Date;gameName:string|null;tagLine:string|null};
export async function GET(request:NextRequest){
 const admin=await requireAdmin(request);if(!admin.ok)return NextResponse.json({ok:false,error:'ADMIN_REQUIRED'},{status:admin.status});
 const rows=await prisma.$queryRaw<Row[]>`SELECT t.*,r."gameName",r."tagLine" FROM "NgShopTitleRequest" t LEFT JOIN "RiotAccount" r ON r."userId"=t."userId" ORDER BY CASE WHEN t."status"='PENDING' THEN 0 ELSE 1 END,t."createdAt" DESC LIMIT 100`;
 return NextResponse.json({ok:true,rows});
}
export async function POST(request:NextRequest){
 const admin=await requireAdmin(request);if(!admin.ok)return NextResponse.json({ok:false,error:'ADMIN_REQUIRED'},{status:admin.status});
 let body:{id?:string;action?:string};try{body=await request.json()}catch{return NextResponse.json({ok:false,error:'INVALID_JSON'},{status:400})}
 if(!body.id||!['APPROVE','REJECT'].includes(String(body.action)))return NextResponse.json({ok:false,error:'INVALID_REQUEST'},{status:400});
 try{
 const out=await prisma.$transaction(async tx=>{
   const records=await tx.$queryRaw<Row[]>`SELECT * FROM "NgShopTitleRequest" WHERE "id"=${body.id} FOR UPDATE`;
   const r=records[0];if(!r||r.status!=='PENDING')throw Error('NOT_PENDING');
   if(body.action==='APPROVE'){
     await tx.$executeRaw`INSERT INTO "NgShopStyle"("userId","title") VALUES (${r.userId},${r.title}) ON CONFLICT("userId") DO UPDATE SET "title"=EXCLUDED."title","updatedAt"=NOW()`;
     await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='CONSUMED',"consumedAt"=NOW() WHERE "id"=${r.itemId}`;
   }else{
     await tx.$executeRaw`UPDATE "NgShopItem" SET "status"='AVAILABLE',"updatedAt"=NOW() WHERE "id"=${r.itemId}`;
   }
   await tx.$executeRaw`UPDATE "NgShopTitleRequest" SET "status"=${body.action==='APPROVE'?'APPROVED':'REJECTED'},"adminId"=${admin.user.id},"reviewedAt"=NOW() WHERE "id"=${body.id}`;
   await tx.adminAuditLog.create({data:{adminId:admin.user.id,action:'SHOP_TITLE_'+body.action,targetType:'User',targetId:r.userId,reason:r.title,afterData:{requestId:r.id}}});
   return {ok:true};
 });return NextResponse.json(out);
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'APPROVAL_FAILED'},{status:409})}
}
