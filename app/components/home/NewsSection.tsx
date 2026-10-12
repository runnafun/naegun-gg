// NAEGUN_ADMIN_V14
import { prisma } from "@/app/lib/prisma";
import { bannerPool } from "@/app/lib/admin-banner-db";
import HomeEventBanner from "./HomeEventBanner";
export default async function NewsSection(){
  const [notices,banners]=await Promise.all([
    prisma.notice.findMany({where:{published:true},take:5,orderBy:{createdAt:"desc"},select:{id:true,title:true,discordThreadId:true}}).catch(()=>[]),
    bannerPool().query(`SELECT id,title,url,"openNewTab" FROM "AdminHomeBanner" WHERE enabled=true ORDER BY position ASC,"createdAt" DESC LIMIT 10`).then(q=>q.rows).catch(()=>[]),
  ]);
  return <section className="info-section">
    <div className="info-grid">
      <div className="info-left">
        <h2 className="section-title">내전.GG 소식&amp;이벤트</h2>
        <HomeEventBanner banners={banners.map(x=>({id:String(x.id),title:String(x.title),url:String(x.url),imageUrl:`/api/site/banner-image/${x.id}`,openNewTab:Boolean(x.openNewTab)}))}/>
      </div>
      <div className="info-right">
        <h2 className="section-title">내전.GG 공지사항</h2>
        <div className="notice-list">
          {notices.length?notices.map(n=><a key={n.id} href="/notice" className="notice-row">
            <span className="notice-title">{n.title}</span><span className="notice-more">더보기</span>
          </a>):<a href="/notice" className="notice-row"><span className="notice-title">등록된 공지가 없습니다.</span><span className="notice-more">더보기</span></a>}
        </div>
      </div>
    </div>
  </section>;
}
