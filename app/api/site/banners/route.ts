import { NextResponse } from "next/server";
import { bannerPool } from "@/app/lib/admin-banner-db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { rows } = await bannerPool().query(`SELECT id,title,url,"openNewTab",position FROM "AdminHomeBanner" WHERE enabled=true ORDER BY position ASC,"createdAt" DESC LIMIT 10`);
    return NextResponse.json({ok:true,banners:rows.map(x=>({id:x.id,title:x.title,url:x.url,openNewTab:x.openNewTab,position:x.position,imageUrl:`/api/site/banner-image/${x.id}`}))},{headers:{"Cache-Control":"no-store"}});
  } catch (e) {
    console.error("PUBLIC_BANNER_LIST",e);
    return NextResponse.json({ok:true,banners:[]},{headers:{"Cache-Control":"no-store"}});
  }
}
