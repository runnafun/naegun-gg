import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return NextResponse.json({ok:false,error:"ADMIN_REQUIRED"},{status:auth.status});
  try{
    const logs=await prisma.adminAuditLog.findMany({take:100,orderBy:{createdAt:"desc"},select:{id:true,action:true,targetType:true,targetId:true,reason:true,createdAt:true,admin:{select:{adminCredential:{select:{username:true}},discordAccount:{select:{globalName:true}}}}}});
    return NextResponse.json({ok:true,items:logs.map(l=>({...l,adminName:l.admin?.adminCredential?.username||l.admin?.discordAccount?.globalName||"SYSTEM",admin:undefined}))},{headers:{"Cache-Control":"no-store"}});
  }catch(e){console.error("ADMIN_CONSOLE_ACTIVITY",e);return NextResponse.json({ok:false,error:"ACTIVITY_FAILED"},{status:500});}
}
