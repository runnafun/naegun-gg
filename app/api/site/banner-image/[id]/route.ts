import { bannerPool } from "@/app/lib/admin-banner-db";
export const dynamic = "force-dynamic";
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){
  const {id}=await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found",{status:404});
  try {
    const {rows}=await bannerPool().query(`SELECT "imageData","imageType" FROM "AdminHomeBanner" WHERE id=$1 AND enabled=true LIMIT 1`,[id]);
    const row=rows[0]; if(!row) return new Response("Not found",{status:404});
    return new Response(Uint8Array.from(row.imageData),{headers:{"Content-Type":row.imageType,"Cache-Control":"public, max-age=60, must-revalidate","X-Content-Type-Options":"nosniff"}});
  } catch(e){console.error("BANNER_IMAGE",e);return new Response("Image unavailable",{status:500});}
}
