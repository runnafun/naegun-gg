// NAEGUN_ATTENDANCE_V1 | All dates use Asia/Seoul.
export type AttendanceKind='COIN'|'ITEM'|'CHOICE';
export type AttendanceReward={day:number;kind:AttendanceKind;sku:string|null;amount:number;label:string;icon:string;iconScale:number};
export const ATTENDANCE_ICONS:{[name:string]:string}={
 coin:'/attendance-assets/ggcoin_icon.png',
 shield:'/shop-assets/items/defance_icon.webp',
 double:'/shop-assets/items/double_icon.webp',
 noban:'/shop-assets/items/noband_icon.webp',
 choice:'/attendance-assets/choiceline_icon.png',
};
export const ATTENDANCE_DEFAULT:AttendanceReward[]=[
 {day:1,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:2,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:3,kind:'ITEM',sku:'rank-shield',amount:1,label:'랭크 보호막',icon:'shield',iconScale:1.22},
 {day:4,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:5,kind:'COIN',sku:null,amount:50,label:'50GG 코인',icon:'coin',iconScale:1.27},
 {day:6,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:7,kind:'COIN',sku:null,amount:70,label:'70GG 코인',icon:'coin',iconScale:1.27},
 {day:8,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:9,kind:'COIN',sku:null,amount:30,label:'30GG 코인',icon:'coin',iconScale:1.27},
 {day:10,kind:'ITEM',sku:'rank-double',amount:1,label:'랭크 2배 티켓',icon:'double',iconScale:1.22},
 {day:11,kind:'COIN',sku:null,amount:50,label:'50GG 코인',icon:'coin',iconScale:1.27},
 {day:12,kind:'COIN',sku:null,amount:50,label:'50GG 코인',icon:'coin',iconScale:1.27},
 {day:13,kind:'COIN',sku:null,amount:100,label:'100GG 코인',icon:'coin',iconScale:1.27},
 {day:14,kind:'CHOICE',sku:'choice-low',amount:1,label:'테두리 선택권',icon:'choice',iconScale:1.28},
];
export function validAttendanceReward(r:AttendanceReward):boolean{
 if(!Number.isInteger(r.day)||r.day<1||r.day>14)return false;
 if(typeof r.label!=='string'||r.label.length<1||r.label.length>28)return false;
 if(!(r.icon in ATTENDANCE_ICONS))return false;
 if(!Number.isFinite(r.iconScale)||r.iconScale<0.7||r.iconScale>1.6)return false;
 if(!Number.isInteger(r.amount)||r.amount<1)return false;
 if(r.kind==='COIN')return r.sku===null&&r.amount<=500;
 if(r.kind==='CHOICE')return r.sku==='choice-low'&&r.amount===1;
 return r.kind==='ITEM'&&['rank-shield','rank-double','no-ban'].includes(String(r.sku))&&r.amount===1;
}
export function kstToday():string{
 const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const g=(s:string)=>p.find(x=>x.type===s)?.value??'';
 return `${g('year')}-${g('month')}-${g('day')}`;
}
