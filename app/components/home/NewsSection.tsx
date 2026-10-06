import Image from "next/image";
import { noticeItems } from "../../data/home";

export default function NewsSection() {
  return (
    <section className="info-section">
      <div className="info-grid">
        <div className="info-left">
          <h2 className="section-title">
            내전.GG 소식&amp;이벤트
          </h2>

          <a href="#" className="event-banner">
            <Image
              src="/images/baner.png"
              alt="내전.GG 이벤트"
              fill
              sizes="(max-width: 900px) 100vw, 560px"
              className="event-banner-image"
            />
          </a>
        </div>

        <div className="info-right">
          <h2 className="section-title">
            내전.GG 공지사항
          </h2>

          <div className="notice-list">
            {noticeItems.map((item, index) => (
              <a
                href="#"
                className="notice-row"
                key={index}
              >
                <span className="notice-title">
                  {item}
                </span>

                <span className="notice-more">
                  더보기
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}