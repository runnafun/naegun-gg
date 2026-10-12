import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { bannerPool,checkBannerMagic,safeBannerUrl } from "@/app/lib/admin-banner-db";
import { requireAdmin } from "@/app/lib/admin-auth";
export const dynamic = "force-dynamic";
const deny=(error:string,status:number)=>NextResponse.json({ok:false,error},{status});
function originOK(request:Request){
  const origin=request.headers.get("origin");if(!origin)return false;
  try {
    const actual=new URL(origin).host;
    const allowed=new Set([new URL(request.url).host]);
    const forwarded=request.headers.get("x-forwarded-host");
    if(forwarded)allowed.add(forwarded.split(",")[0].trim());
    if(process.env.APP_URL)allowed.add(new URL(process.env.APP_URL).host);
    return allowed.has(actual);
  }catch{return false;}
}
function parseFields(form:FormData){
  const title=String(form.get("title")??"").trim();
  const url=safeBannerUrl(form.get("url"));
  const position=Number(form.get("position")??0);
  const enabled=String(form.get("enabled")??"false")==="true";
  const openNewTab=String(form.get("openNewTab")??"false")==="true";
  if(!title||title.length>120)throw new Error("제목은 1~120자로 입력해 주세요.");
  if(!url)throw new Error("링크는 /로 시작하는 내부 경로 또는 http(s) 주소를 입력해 주세요.");
  if(!Number.isSafeInteger(position)||position<0||position>10000)throw new Error("순서는 0~10000 범위여야 합니다.");
  return {title,url,position,enabled,openNewTab};
}
async function readFile(form:FormData,required:boolean){
  const v=form.get("image");
  if(!(v instanceof File)||v.size===0){if(required)throw new Error("이미지를 선택해 주세요.");return null;}
  if(v.size>3*1024*1024)throw new Error("이미지는 3MB 이하여야 합니다.");
  const buf=Buffer.from(await v.arrayBuffer());
  if(!checkBannerMagic(buf,v.type))throw new Error("PNG/JPG/WEBP만 업로드할 수 있습니다.");
  return {buf,type:v.type};
}
async function transaction<T>(fn:(db:PoolClient)=>Promise<T>):Promise<T>{
  const db=await bannerPool().connect();
  try{await db.query("BEGIN");const value=await fn(db);await db.query("COMMIT");return value;}
  catch(e){await db.query("ROLLBACK").catch(()=>{});throw e;}
  finally{db.release();}
}
async function audit(db:PoolClient,adminId:string,action:string,id:string,before:unknown,after:unknown){
  await db.query(`INSERT INTO "AdminAuditLog" (id,"adminId",action,"targetType","targetId","beforeData","afterData") VALUES ($1,$2,$3,'AdminHomeBanner',$4,$5::jsonb,$6::jsonb)`,
    [randomUUID(),adminId,action,id,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);
}
export async function GET(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return deny("관리자 인증 필요",auth.status);
  try{
    const {rows}=await bannerPool().query(`SELECT id,title,url,enabled,"openNewTab",position,"createdAt","updatedAt" FROM "AdminHomeBanner" ORDER BY position ASC,"createdAt" DESC LIMIT 100`);
    return NextResponse.json({ok:true,banners:rows.map(x=>({...x,imageUrl:`/api/admin/console/banners/image/${x.id}`}))},{headers:{"Cache-Control":"no-store"}});
  }catch(e){console.error("ADMIN_BANNERS_GET",e);return deny("배너 목록 조회 실패",500);}
}
export async function POST(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return deny("관리자 인증 필요",auth.status);
  if(!originOK(request))return deny("요청 출처 확인 실패",403);
  try{
    const form=await request.formData();const fields=parseFields(form);const file=await readFile(form,true);
    if(!file)return deny("이미지가 필요합니다.",400);
    const id=randomUUID();
    await transaction(async db=>{
      await db.query(`INSERT INTO "AdminHomeBanner" (id,title,url,enabled,"openNewTab",position,"imageData","imageType") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id,fields.title,fields.url,fields.enabled,fields.openNewTab,fields.position,file.buf,file.type]);
      await audit(db,auth.user.id,"HOME_BANNER_CREATED",id,null,fields);
    });
    return NextResponse.json({ok:true,id});
  }catch(e){console.error("ADMIN_BANNERS_CREATE",e);return deny(e instanceof Error?e.message:"배너 등록 실패",400);}
}
export async function PATCH(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return deny("관리자 인증 필요",auth.status);
  if(!originOK(request))return deny("요청 출처 확인 실패",403);
  try{
    const form=await request.formData(),id=String(form.get("id")??"");
    if(!/^[0-9a-f-]{36}$/i.test(id))return deny("ID 오류",400);
    const fields=parseFields(form),file=await readFile(form,false);
    const changed=await transaction(async db=>{
      const previous=await db.query(`SELECT title,url,enabled,"openNewTab",position FROM "AdminHomeBanner" WHERE id=$1 FOR UPDATE`,[id]);
      if(!previous.rows.length)return false;
      if(file){await db.query(`UPDATE "AdminHomeBanner" SET title=$2,url=$3,enabled=$4,"openNewTab"=$5,position=$6,"imageData"=$7,"imageType"=$8,"updatedAt"=NOW() WHERE id=$1`,[id,fields.title,fields.url,fields.enabled,fields.openNewTab,fields.position,file.buf,file.type]);}
      else{await db.query(`UPDATE "AdminHomeBanner" SET title=$2,url=$3,enabled=$4,"openNewTab"=$5,position=$6,"updatedAt"=NOW() WHERE id=$1`,[id,fields.title,fields.url,fields.enabled,fields.openNewTab,fields.position]);}
      await audit(db,auth.user.id,"HOME_BANNER_UPDATED",id,previous.rows[0],fields);
      return true;
    });
    if(!changed)return deny("배너가 없습니다.",404);
    return NextResponse.json({ok:true});
  }catch(e){console.error("ADMIN_BANNERS_UPDATE",e);return deny(e instanceof Error?e.message:"배너 수정 실패",400);}
}
export async function DELETE(request:Request){
  const auth=await requireAdmin(request);if(!auth.ok)return deny("관리자 인증 필요",auth.status);
  if(!originOK(request))return deny("요청 출처 확인 실패",403);
  try{
    const {id}=await request.json();
    if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return deny("ID 오류",400);
    const changed=await transaction(async db=>{
      const previous=await db.query(`SELECT title,url,enabled,"openNewTab",position FROM "AdminHomeBanner" WHERE id=$1 FOR UPDATE`,[id]);
      if(!previous.rows.length)return false;
      await audit(db,auth.user.id,"HOME_BANNER_DELETED",id,previous.rows[0],null);
      await db.query(`DELETE FROM "AdminHomeBanner" WHERE id=$1`,[id]);
      return true;
    });
    if(!changed)return deny("배너가 없습니다.",404);
    return NextResponse.json({ok:true});
  }catch(e){console.error("ADMIN_BANNERS_DELETE",e);return deny("배너 삭제 실패",500);}
}
