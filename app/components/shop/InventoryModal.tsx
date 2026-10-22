'use client';
import {useCallback,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {findProduct} from '@/app/lib/naegun-shop-products';
import './naegun-shop-ui.css';
type Item={id:string;sku:string;status:string;meta:{champion?:string;round?:number}|null;scrimId:string|null};
type ShopState={ok:boolean;balance:string;items:Item[];style:{frameSku:string|null;title:string|null};requests:{itemId:string;status:string;title:string}[]};
const messages:Record<string,string>={INSUFFICIENT_GG_COIN:'GG코인이 부족합니다.',FRAME_ALREADY_OWNED:'이미 보유한 테두리입니다.',ITEM_ALREADY_RESERVED:'이미 내전에 예약된 아이템입니다.',ITEM_ALREADY_USED:'사용할 수 없는 상태입니다.',INVALID_NO_BAN_SELECTION:'챔피언 이름과 라운드를 확인하세요.',LOGIN_REQUIRED:'로그인이 필요합니다.'};
export default function InventoryModal({onClose}:{onClose:()=>void}){
 const [data,setData]=useState<ShopState|null>(null);
 const [tab,setTab]=useState<'FRAME'|'TITLE'|'RANK'>('FRAME');
 const [busy,setBusy]=useState(''),[notice,setNotice]=useState('');
 const [editor,setEditor]=useState<Item|null>(null);
 const [champion,setChampion]=useState(''),[round,setRound]=useState(1),[title,setTitle]=useState('');
 const [choiceFrame,setChoiceFrame]=useState('frame-5'); // NAEGUN_ATTENDANCE_VOUCHER_INVENTORY_V1
 const load=useCallback(async()=>{try{const r=await fetch('/api/shop/state',{cache:'no-store'});const v=await r.json();if(!r.ok)throw Error(v.error);setData(v)}catch(e){setNotice(String(e))}},[]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[onClose]);
 async function useItem(item:Item|null,action:string,values:Record<string,unknown>={}){
  setBusy(item?.id??'none');setNotice('');
  try{
   const r=await fetch(action==='REDEEM_FRAME'?'/api/attendance/redeem':'/api/shop/use',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,itemId:item?.id??null,...values})});
   const v=await r.json();if(!r.ok)throw Error(messages[v.error]??v.error);
   setNotice('처리 완료되었습니다.');setEditor(null);await load();window.dispatchEvent(new Event('naegun-shop-updated'));if(action==='EQUIP'&&/^(\/ranking|\/matches\/result|\/profile-search\/result)/.test(location.pathname))location.reload();
  }catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy('')}
 }
 const choose=(item:Item)=>{
  if(item.sku==='choice-low'){const available=[5,6,7,8,9].find(n=>!data?.items.some(x=>x.sku===`frame-${n}`));if(!available){setNotice('이미 저가 테두리를 모두 보유하고 있습니다.');return;}setEditor(item);setChoiceFrame(`frame-${available}`);return;}
  if(item.sku==='no-ban'||item.sku==='custom-title'){
   setEditor(item);setChampion('');setRound(1);setTitle('');
  }else void useItem(item,'ARM');
 };
 const commit=()=>{
  if(!editor)return;
  if(editor.sku==='choice-low')void useItem(editor,'REDEEM_FRAME',{frameSku:choiceFrame});
  else if(editor.sku==='no-ban')void useItem(editor,'ARM',{champion,round});
  else void useItem(editor,'TITLE',{title});
 };
 return createPortal(<div className="ng-inv-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="ng-inv-modal" role="dialog" aria-modal="true" aria-label="내 보관함">
   <header className="ng-inv-header"><div><h2>내 보관함</h2><span>보유 아이템을 장착하거나 사용할 수 있습니다.</span></div><button onClick={onClose} aria-label="닫기">✕</button></header>
   <nav className="ng-inv-tabs">{(['FRAME','TITLE','RANK'] as const).map(t=><button className={tab===t?'active':''} key={t} onClick={()=>{setTab(t);setEditor(null)}}>{t==='FRAME'?'프로필 테두리':t==='TITLE'?'칭호':'랭크 아이템'}</button>)}</nav>
   {notice&&<p className="ng-inv-notice">{notice}</p>}
   {editor&&<div className="ng-inv-editor"><h3>{editor.sku==='choice-low'?'테두리 선택권 사용':editor.sku==='no-ban'?'노벤 티켓 설정':'커스텀 칭호 신청'}</h3>
    {editor.sku==='choice-low'?<label>받을 테두리 (저가 5~9번)<select value={choiceFrame} onChange={e=>setChoiceFrame(e.target.value)}>{[5,6,7,8,9].filter(n=>!data?.items.some(x=>x.sku===`frame-${n}`)).map(n=><option key={n} value={`frame-${n}`}>{findProduct(`frame-${n}`)?.name}</option>)}</select></label>:editor.sku==='no-ban'?<><label>어떤 챔피언을 밴픽에 제한하시겠습니까?<input value={champion} maxLength={35} onChange={e=>setChampion(e.target.value)} placeholder="예: 아리" /></label><label>몇 라운드에 적용하시겠습니까?<select value={round} onChange={e=>setRound(Number(e.target.value))}><option value={1}>1라운드</option><option value={2}>2라운드</option></select></label></>:<label>신청할 칭호 (2~15자)<input value={title} maxLength={15} onChange={e=>setTitle(e.target.value)} placeholder="원하는 칭호 입력" /></label>}
    <div className="ng-inv-editor-actions"><button disabled={!!busy} onClick={commit}>신청 / 적용</button><button onClick={()=>setEditor(null)}>취소</button></div>
   </div>}
   <div className="ng-inv-grid">{data?.items.filter(i=>findProduct(i.sku)?.kind===tab).map(item=>{const product=findProduct(item.sku)!;const equipped=data.style.frameSku===item.sku;return <article key={item.id} className="ng-inv-card"><img src={product.image} alt="" loading="lazy"/><b>{product.name}</b><small>{equipped?'장착 중':item.status==='ARMED'?'다음 내전 적용 대기':item.status==='RESERVED'?'내전 신청 완료':item.status==='ACTIVE'?'내전 적용 중':item.status==='SUBMITTED'?'관리자 승인 대기':item.status==='CONSUMED'?'사용 완료':'사용 가능'}</small>{tab==='FRAME'?<button disabled={!!busy||equipped} onClick={()=>item.sku==='choice-low'?choose(item):void useItem(item,'EQUIP')}>{item.sku==='choice-low'?'테두리 선택':equipped?'장착 중':'장착하기'}</button>:item.status==='AVAILABLE'?<button disabled={!!busy} onClick={()=>choose(item)}>적용하기</button>:item.status==='ARMED'?<button disabled={!!busy} onClick={()=>void useItem(item,'DISARM')}>적용 취소</button>:<button disabled>처리 중 / 사용 완료</button>}</article>})}{data&&!data.items.some(i=>findProduct(i.sku)?.kind===tab)&&<p>보유한 아이템이 없습니다.</p>}</div>
   {tab==='FRAME'&&data?.style.frameSku&&<button className="ng-inv-unequip" onClick={()=>void useItem(null,'EQUIP')}>테두리 해제</button>}
  </section>
 </div>,document.body);
}
