import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/admin-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return NextResponse.json({ok:false,error:"ADMIN_REQUIRED"},{status:auth.status});
  try{
    const url=new URL(request.url);
    const keyword=(url.searchParams.get("q")??"").trim().slice(0,80);
    const page=Math.min(1000,Math.max(1,Number(url.searchParams.get("page")||"1")||1));
    const where=keyword?{OR:[
      {riotAccount:{is:{gameName:{contains:keyword,mode:"insensitive" as const}}}},
      {riotAccount:{is:{tagLine:{contains:keyword,mode:"insensitive" as const}}}},
      {discordAccount:{is:{username:{contains:keyword,mode:"insensitive" as const}}}},
      {discordAccount:{is:{globalName:{contains:keyword,mode:"insensitive" as const}}}},
      {discordAccount:{is:{discordUserId:{contains:keyword}}}},
    ]}:{};
    const [total,rows]=await Promise.all([
      prisma.user.count({where}),prisma.user.findMany({where,skip:(page-1)*30,take:30,orderBy:{createdAt:"desc"},select:{id:true,role:true,status:true,createdAt:true,discordAccount:{select:{username:true,globalName:true,discordUserId:true}},riotAccount:{select:{gameName:true,tagLine:true,soloTier:true,soloRank:true}},stats:{select:{tierScore:true,wins:true,losses:true}},defenseStats:{select:{progress:true,tickets:true}},wallet:{select:{balance:true}}}})
    ]);
    return NextResponse.json({ok:true,total,page,pageSize:30,items:rows.map(u=>({...u,wallet:{balance:String(u.wallet?.balance??BigInt(0))}}))},{headers:{"Cache-Control":"no-store"}});
  }catch(e){console.error("ADMIN_CONSOLE_MEMBERS",e);return NextResponse.json({ok:false,error:"MEMBERS_FAILED"},{status:500});}
}
