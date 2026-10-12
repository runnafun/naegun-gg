"use client";
import { useEffect, useState } from "react";
type Banner={id:string,title:string,url:string,imageUrl:string,openNewTab:boolean};
export default function HomeEventBanner({banners}:{banners:Banner[]}){
  const [index,setIndex]=useState(0);
  useEffect(()=>{
    if(banners.length<2)return;
    const timer=setInterval(()=>setIndex(x=>(x+1)%banners.length),5500);
    return ()=>clearInterval(timer);
  },[banners.length]);
  if(!banners.length){return <a href="/notice" className="event-banner" aria-label="내전.GG 공지 보러가기">
    <img src="/images/baner.png" alt="내전.GG 이벤트" className="event-banner-image" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
  </a>;}
  const current=banners[index%banners.length];
  return <div className="event-banner" style={{position:"relative",overflow:"hidden"}}>
    <a href={current.url} target={current.openNewTab?"_blank":undefined} rel={current.openNewTab?"noopener noreferrer":undefined} title={current.title}
      style={{display:"block",position:"absolute",inset:0}}>
      <img src={current.imageUrl} alt={current.title} className="event-banner-image" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
    </a>
    {banners.length>1&&<div style={{position:"absolute",zIndex:2,bottom:9,right:10,display:"flex",gap:6}}>
      {banners.map((b,i)=><button key={b.id} type="button" aria-label={`${i+1}번 이벤트 배너 보기`} onClick={()=>setIndex(i)} style={{width:i===index?18:7,height:7,borderRadius:20,border:0,background:i===index?"white":"#ffffff77",cursor:"pointer"}}/>)}
    </div>}
  </div>;
}
