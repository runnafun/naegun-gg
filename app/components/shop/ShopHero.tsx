type ShopHeroProps = {
  query: string;
  onChange: (value: string) => void;
};

export default function ShopHero({
  query,
  onChange,
}: ShopHeroProps) {
  return (
    <section className="shop-hero">
      <div className="shop-hero-overlay" />

      <div className="shop-hero-content">
        <div className="shop-hero-text">
          <h1 className="shop-hero-title">
            내전.GG 상점에 오신 것을 환영합니다
          </h1>

          <p className="shop-hero-description">
            다양한 새로운 상품을 만나보실 수 있습니다.
          </p>
        </div>

        <div className="shop-search-wrap">
          <input
            type="text"
            value={query}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder="상품 이름 검색"
            className="shop-search-input"
          />
        </div>
      </div>
    </section>
  );
}