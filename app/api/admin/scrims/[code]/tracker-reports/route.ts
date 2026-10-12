import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(request:NextRequest, context:{params:Promise<{code:string}>}){
  const admin=await requireAdmin(request);
  if(!admin.ok) return NextResponse.json({error:"ADMIN_REQUIRED"},{status:admin.status});
  const code=(await context.params).code.trim().toUpperCase();
  const scrim=await prisma.scrim.findUnique({where:{code},select:{id:true,type:true,status:true}});
  if(!scrim || scrim.type!=="RANKED") return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const logs=await prisma.adminAuditLog.findMany({
    where:{action:"TRACKER_SET_RECEIVED",targetType:"Scrim",targetId:scrim.id},
    orderBy:{createdAt:"desc"},take:30,
    select:{id:true,afterData:true,createdAt:true},
  });
  return NextResponse.json({ok:true,code,status:scrim.status,records:logs},{headers:{"Cache-Control":"no-store"}});
}
