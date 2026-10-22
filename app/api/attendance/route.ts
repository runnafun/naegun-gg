import {NextResponse} from 'next/server';
import {getSession} from '@/app/lib/auth';
import {getAttendancePublic,claimAttendance} from '@/app/lib/attendance-db';
export const dynamic='force-dynamic';
export async function GET(){try{const session=await getSession();return NextResponse.json(await getAttendancePublic(session?.userId??null),{headers:{'Cache-Control':'private, no-store'}})}catch(error){console.error('ATTENDANCE_READ',error);return NextResponse.json({ok:false,error:'ATTENDANCE_READ_FAILED'},{status:500})}}
export async function POST(){const session=await getSession();if(!session)return NextResponse.json({ok:false,error:'LOGIN_REQUIRED'},{status:401});try{return NextResponse.json(await claimAttendance(session.userId),{headers:{'Cache-Control':'no-store'}})}catch(error){const reason=error instanceof Error?error.message:'CLAIM_FAILED';console.warn('ATTENDANCE_CLAIM',reason);return NextResponse.json({ok:false,error:reason.includes('unique')?'ALREADY_CLAIMED':reason},{status:409})}}
