import Image from "next/image";
import type { Shop } from "@data/interface";

interface ShopListProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onShopSelect: (shop: Shop) => void;
  floor: number;
  filters: {
    launch: boolean;
    dinner: boolean;
    type: "전체" | Shop["type"];
  };
  onFilterChange: (filters: {
    launch: boolean;
    dinner: boolean;
    type: "전체" | Shop["type"];
  }) => void;
}

export default function ShopList({
  shops,
  selectedShop,
  onShopSelect,
  floor,
  filters,
  onFilterChange,
}: ShopListProps) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>{floor}층 상가 목록</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() =>
                onFilterChange({ ...filters, launch: !filters.launch })
              }
              style={{
                padding: "6px 12px",
                background: filters.launch ? "#2563eb" : "#f8f9fa",
                color: filters.launch ? "#fff" : "#2563eb",
                border: "1px solid #2563eb",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
            >
              점심
            </button>
            <button
              onClick={() =>
                onFilterChange({ ...filters, dinner: !filters.dinner })
              }
              style={{
                padding: "6px 12px",
                background: filters.dinner ? "#2563eb" : "#f8f9fa",
                color: filters.dinner ? "#fff" : "#2563eb",
                border: "1px solid #2563eb",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
            >
              석식
            </button>
          </div>
          <select
            value={filters.type}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                type: e.target.value as Shop["type"] | "전체",
              })
            }
            style={{
              padding: "6px 12px",
              background: "#f8f9fa",
              color: "#2563eb",
              border: "1px solid #2563eb",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              minWidth: "80px",
            }}
          >
            <option value="전체">전체</option>
            <option value="한식">한식</option>
            {/* <option value="중식">중식</option>
            <option value="일식">일식</option>
            <option value="양식">양식</option> */}
            <option value="분식">분식</option>
            <option value="뷔페">뷔페</option>
            {/* <option value="기타">기타</option> */}
          </select>
        </div>
      </div>
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
