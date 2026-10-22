// NAEGUN_SHOP_V1: item catalog; keep SKU stable after deployment.
export type ShopKind = 'FRAME'|'TITLE'|'RANK';
export type ShopProduct = { id:string; name:string; kind:ShopKind; price:number; image:string; fullImage?:string; description:string };
const frames:[number,string][] = [
 [1,'보랏빛 냥꼬리'],[2,'아기천사 살랑링'],[3,'꼬마악마 심술링'],[4,'벚꽃이 몽글몽글'],
 [5,'초록빛 또르르'],[6,'얼음별 반짝링'],[7,'금빛별 총총'],[8,'보랏불 꼬물꼬물'],[9,'빨간빛 쌩쌩링'],
 [10,'냥냥 비트 ON'],[11,'페페의 연못'],[12,'달나라 꿀잠냥'],[13,'삐빅! 오류났어요'],
 [14,'방구석 겜돌냥'],[15,'우주에서 온 꼬물이'],[16,'말랑왕 슬라임'],
 [17,'불닭 먹은 꼬양이'],[18,'하트 한 번 클릭!'],[19,'꽥꽥 뽀득타임'],
];
export const SHOP_PRODUCTS:ShopProduct[] = [
 ...frames.map(([i,name])=>({id:`frame-${i}`,name,kind:'FRAME' as const,
   price:i>=5&&i<=9?1500:i<=4?3500:8000,
   image:`/shop-assets/thumb/profile_${i}.webp`,fullImage:`/shop-assets/full/profile_${i}.png`,
   description:'구매 후 보관함에서 장착할 수 있는 영구 프로필 테두리'})),
 {id:'custom-title',name:'커스텀 칭호 티켓',kind:'TITLE',price:50000,image:'/shop-assets/items/custom_icon.webp',description:'희망 칭호를 관리자에게 신청하는 티켓'},
 {id:'rank-shield',name:'랭크 보호막',kind:'RANK',price:3000,image:'/shop-assets/items/defance_icon.webp',description:'선택한 랭크 내전의 패배 점수 차감 1회 방어'},
 {id:'rank-double',name:'랭크 2배 티켓',kind:'RANK',price:3000,image:'/shop-assets/items/double_icon.webp',description:'승리 시 내전랭크 점수만 +2 (GG코인 보상은 그대로)'},
 {id:'no-ban',name:'노벤 티켓',kind:'RANK',price:5000,image:'/shop-assets/items/noband_icon.webp',description:'선택한 챔피언을 지정 세트에서 밴하지 못하도록 공지'},
];
// NAEGUN_ATTENDANCE_VOUCHER_V1 — Inventory item, not for sale.
const ATTENDANCE_VOUCHER:ShopProduct={id:'choice-low',name:'테두리 선택권',kind:'FRAME',price:0,image:'/attendance-assets/choiceline_icon.png',description:'출석 14일차 보상. 5~9번 중 테두리 선택'};
export function findProduct(sku:string){return sku==='choice-low'?ATTENDANCE_VOUCHER:SHOP_PRODUCTS.find(p=>p.id===sku)}
export function frameImage(sku:string|undefined|null,size:'thumb'|'card'|'full'='thumb') {
 const n=Number(sku?.match(/^frame-(\d{1,2})$/)?.[1]);
 return n>=1&&n<=19?`/shop-assets/${size}/profile_${n}.${size==='full'?'png':'webp'}`:null;
}
