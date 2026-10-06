import type { ShopProduct } from "../../data/shop";
import ShopProductCard from "./ShopProductCard";

type ShopSectionProps = {
  title: string;
  items: ShopProduct[];
  variant: "pack" | "title";
  hasMore?: boolean;
  onMore?: () => void;
};

export default function ShopSection({
  title,
  items,
  variant,
  hasMore = false,
  onMore,
}: ShopSectionProps) {
  return (
    <section className="shop-section">
      <h2 className="shop-section-title">
        {title}
      </h2>

      {items.length > 0 ? (
        <>
          <div
            className={`shop-product-grid shop-product-grid--${variant}`}
          >
            {items.map((item) => (
              <ShopProductCard
                key={item.id}
                item={item}
                variant={variant}
              />
            ))}
          </div>

          {hasMore && onMore && (
            <button
              type="button"
              className="shop-more-button"
              onClick={onMore}
            >
              더보기
            </button>
          )}
        </>
      ) : (
        <div className="shop-empty-state">
          검색 결과가 없습니다.
        </div>
      )}
    </section>
  );
}