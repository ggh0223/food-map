import type { Shop } from "@data/interface";

interface ShopInfoProps {
  shop: Shop;
}

export default function ShopInfo({ shop }: ShopInfoProps) {
  return (
    <div
      style={{
        padding: 16,
        background: "#fff",
        borderRadius: 8,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>{shop.name}</h1>
      <div style={{ display: "flex", gap: 16 }}>
        <div
          style={{
            flex: 1,
          }}
        >
          <p>{shop.description}</p>
          <p>{shop.contact}</p>
        </div>

        <div style={{ width: 1, background: "#ddd" }} />

        <div style={{ flex: 1 }}>
          {shop.menuList && (
            <div>
              {shop.menuList.map((menu) => (
                <div key={menu.name}>{menu.name}</div>
              ))}
            </div>
          )}
          {shop.menuLinkUrl && (
            <a
              href={shop.menuLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "#2563eb",
                textDecoration: "none",
                marginTop: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              메뉴 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
