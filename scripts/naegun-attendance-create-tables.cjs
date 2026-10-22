// Additive migration: attendance only. Existing tables and data untouched.
const {loadEnvConfig}=require('@next/env');
const {Client}=require('pg');
loadEnvConfig(process.cwd());
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing');
const sql=String.raw`
CREATE TABLE IF NOT EXISTS "NgAttendanceSet" (
 "id" TEXT PRIMARY KEY,
 "title" TEXT NOT NULL,
 "startDate" DATE NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT','PUBLISHED','CLOSED')),
 "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ng_attendance_set_active" ON "NgAttendanceSet"("status","startDate");
CREATE TABLE IF NOT EXISTS "NgAttendanceReward" (
 "setId" TEXT NOT NULL REFERENCES "NgAttendanceSet"("id") ON DELETE CASCADE,
 "day" INTEGER NOT NULL CHECK("day" BETWEEN 1 AND 14),
 "kind" TEXT NOT NULL CHECK("kind" IN ('COIN','ITEM','CHOICE')),
 "sku" TEXT,
 "amount" INTEGER NOT NULL CHECK("amount" > 0),
 "label" TEXT NOT NULL,
 "icon" TEXT NOT NULL,
 "iconScale" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
 PRIMARY KEY("setId","day")
);
CREATE TABLE IF NOT EXISTS "NgAttendanceClaim" (
 "id" TEXT PRIMARY KEY,
 "setId" TEXT NOT NULL REFERENCES "NgAttendanceSet"("id"),
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "day" INTEGER NOT NULL CHECK("day" BETWEEN 1 AND 14),
 "claimedKstDate" DATE NOT NULL,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE("setId","userId","day")
);
CREATE INDEX IF NOT EXISTS "ng_attendance_claim_user" ON "NgAttendanceClaim"("userId","createdAt" DESC);
`;
(async()=>{
 const c=new Client({connectionString:process.env.DATABASE_URL}); await c.connect();
 try {await c.query('BEGIN');await c.query(sql);await c.query('COMMIT');console.log('✅ 출석체크 전용 테이블 3개 준비 (기존 재화·내전 데이터 유지)')}
 catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
})().catch(e=>{console.error('❌ 출석체크 테이블 준비 실패',e.message);process.exitCode=1});
