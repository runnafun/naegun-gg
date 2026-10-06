import type { ShopProduct } from "../../data/shop";

type ShopProductCardProps = {
  item: ShopProduct;
  variant: "pack" | "title";
};

export default function ShopProductCard({
  item,
  variant,
}: ShopProductCardProps) {
  const hasBackground =
    variant === "title" &&
    !!item.backgroundImage;

  const hasCenterThumb = !!item.image;

  const isCardChoice =
    item.id === "card-choice";

  const isNicknameChoice =
    item.id === "nickname-choice";

  return (
    <article
      className={[
        "shop-product-card",
        `shop-product-card--${variant}`,
        isCardChoice
          ? "shop-product-card--card-choice"
          : "",
        isNicknameChoice
          ? "shop-product-card--nickname-choice"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasBackground && (
        <div
          className="shop-product-card-bg"
          style={{
            backgroundImage:
              `url("${item.backgroundImage}")`,
          }}
        />
      )}

      <div className="shop-product-card-overlay" />

      <div className="shop-product-card-inner">
        {hasCenterThumb && (
          <div className="shop-product-thumb">
            <img
              src={item.image}
              alt={item.name}
              className="shop-product-thumb-image"
            />
          </div>
        )}

        <div className="shop-product-meta">
          <strong className="shop-product-name">
            {item.name}
          </strong>

          <span className="shop-product-price">
            {item.price} GC
          </span>
        </div>
      </div>
    </article>
  );
}