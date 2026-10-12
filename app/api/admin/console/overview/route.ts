import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const auth=await requireAdmin(request);
  if(!auth.ok)return NextResponse.json({ok:false,error:"ADMIN_REQUIRED"},{status:auth.status});
  try{
    const [registered,active,open,selection,running,finished,notices,latestScrims,latestLogs,noticeRows,settled,sent]=await Promise.all([
      prisma.user.count(),prisma.user.count({where:{status:"ACTIVE"}}),
      prisma.scrim.count({where:{status:"OPEN"}}),prisma.scrim.count({where:{status:"TEAM_SELECTION"}}),
      prisma.scrim.count({where:{status:"IN_PROGRESS"}}),prisma.scrim.count({where:{status:"FINISHED"}}),
      prisma.notice.count({where:{published:true}}),
      prisma.scrim.findMany({take:12,orderBy:{createdAt:"desc"},select:{id:true,code:true,type:true,status:true,createdAt:true,startAt:true,_count:{select:{participants:true}}}}),
      prisma.adminAuditLog.findMany({take:14,orderBy:{createdAt:"desc"},select:{id:true,action:true,targetType:true,targetId:true,reason:true,createdAt:true}}),
      prisma.notice.findMany({where:{published:true},take:8,orderBy:{createdAt:"desc"},select:{id:true,title:true,createdAt:true,discordThreadId:true}}),
      prisma.adminAuditLog.count({where:{action:"RANKED_SETTLED",targetType:"Scrim"}}),
      prisma.adminAuditLog.count({where:{action:"RANKED_RESULT_DM_SENT",targetType:"Scrim"}}),
    ]);
    return NextResponse.json({ok:true,stats:{registered,active,open,selection,running,finished,notices,settled,sent},scrims:latestScrims,logs:latestLogs,notices:noticeRows},{headers:{"Cache-Control":"no-store"}});
  }catch(e){console.error("ADMIN_CONSOLE_OVERVIEW",e);return NextResponse.json({ok:false,error:"DASHBOARD_FAILED"},{status:500});}
}
