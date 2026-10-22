// Additive shop tables only; no DROP/ALTER existing tables, no wallet mutation.
const {loadEnvConfig}=require('@next/env');
const {Client}=require('pg');
loadEnvConfig(process.cwd());
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing');
const SQL=String.raw`
CREATE TABLE IF NOT EXISTS "NgShopItem" (
 "id" TEXT PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "sku" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
 "scrimId" TEXT REFERENCES "Scrim"("id") ON DELETE SET NULL,
 "meta" JSONB NOT NULL DEFAULT '{}'::jsonb,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 "consumedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "ng_shop_item_owner_status_idx" ON "NgShopItem"("userId","status");
CREATE INDEX IF NOT EXISTS "ng_shop_item_scrim_idx" ON "NgShopItem"("scrimId","status");
CREATE UNIQUE INDEX IF NOT EXISTS "ng_shop_single_frame_idx" ON "NgShopItem"("userId","sku") WHERE "sku" LIKE 'frame-%';
CREATE TABLE IF NOT EXISTS "NgShopStyle" (
 "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
 "frameSku" TEXT,
 "title" TEXT,
 "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "NgShopTitleRequest" (
 "id" TEXT PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "itemId" TEXT NOT NULL UNIQUE REFERENCES "NgShopItem"("id"),
 "title" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING',
 "adminId" TEXT,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 "reviewedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "ng_shop_title_pending_idx" ON "NgShopTitleRequest"("status","createdAt");
`;
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
 try{await c.query('BEGIN');await c.query(SQL);await c.query('COMMIT');console.log('✅ 내전.GG 상점용 테이블 3개 준비 (기존 데이터 보존)');}
 catch(e){await c.query('ROLLBACK');throw e} finally{await c.end()}
})().catch(e=>{console.error('❌ 상점 DB 생성 실패:',e.message);process.exitCode=1});
