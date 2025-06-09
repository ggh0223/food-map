import Image from "next/image";
import type { Shop } from "@data/interface";

interface ShopListProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onShopSelect: (shop: Shop) => void;
  floor: number;
}

export default function ShopList({
  shops,
  selectedShop,
  onShopSelect,
  floor,
}: ShopListProps) {
  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        {floor}층 상가 목록
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          overflow: "auto",
          maxHeight: "calc(100vh - 450px)",
        }}
      >
        {shops.map((shop) => (
          <div
            key={shop.id}
            onClick={() => onShopSelect(shop)}
            style={{
              padding: 16,
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s",
              border:
                selectedShop?.id === shop.id
                  ? "2px solid #2563eb"
                  : "2px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image
                src={shop.logoUrl || "/icon-192x192.png"}
                alt={shop.name}
                width={40}
                height={40}
                style={{ borderRadius: 8 }}
              />
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "var(--text-color)",
                  }}
                >
                  {shop.name}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {shop.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
