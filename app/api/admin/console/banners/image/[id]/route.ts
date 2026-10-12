import { requireAdmin } from "@/app/lib/admin-auth";
import { bannerPool } from "@/app/lib/admin-banner-db";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){
  const auth=await requireAdmin(request);if(!auth.ok)return new Response("Unauthorized",{status:auth.status});
  const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return new Response("Not found",{status:404});
  try{const {rows}=await bannerPool().query(`SELECT "imageData","imageType" FROM "AdminHomeBanner" WHERE id=$1 LIMIT 1`,[id]);
    if(!rows.length)return new Response("Not found",{status:404});
    return new Response(Uint8Array.from(rows[0].imageData),{headers:{"Content-Type":rows[0].imageType,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch(e){console.error("ADMIN_BANNER_IMAGE",e);return new Response("Error",{status:500});}
}
