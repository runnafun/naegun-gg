import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/app/lib/admin-auth';
import {getAttendanceAdmin,attendanceAdminAction} from '@/app/lib/attendance-db';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const admin=await requireAdmin(request);if(!admin.ok)return NextResponse.json({ok:false,error:'ADMIN_REQUIRED'},{status:admin.status});
 try{return NextResponse.json(await getAttendanceAdmin(),{headers:{'Cache-Control':'no-store'}})}catch(e){console.error('ATTENDANCE_ADMIN_GET',e);return NextResponse.json({ok:false,error:'LOAD_FAILED'},{status:500})}
}
export async function POST(request:NextRequest){
 const admin=await requireAdmin(request);if(!admin.ok)return NextResponse.json({ok:false,error:'ADMIN_REQUIRED'},{status:admin.status});
 let input:Parameters<typeof attendanceAdminAction>[1];try{input=await request.json()}catch{return NextResponse.json({ok:false,error:'INVALID_JSON'},{status:400})}
 try{return NextResponse.json(await attendanceAdminAction(admin.user.id,input))}catch(e){const error=e instanceof Error?e.message:'SAVE_FAILED';console.error('ATTENDANCE_ADMIN_SAVE',error);return NextResponse.json({ok:false,error},{status:409})}
}
