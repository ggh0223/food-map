import { useState } from "react";
import shopsData from "../data/shops.json";
import type { Shop } from "@data/interface";
import Image from "next/image";

const floorKey = (floor: number): "floor1" | "floor2" => {
  return floor === 1 ? "floor1" : "floor2";
};

export default function FloorMap() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [floor, setFloor] = useState(1);

  const shops: Shop[] = shopsData[floorKey(floor)] || [];

  const handleClick = (id: string) => {
    const shop = shops.find((s) => s.id === id);
    setSelectedShop(shop ?? null);
  };

  return (
    <div
      style={{
        width: "100%",
        // maxWidth: "500px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {/* 층 선택 버튼 */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setFloor(1)}
          style={{
            padding: "8px 16px",
            background: floor === 1 ? "#2563eb" : "#fff",
            color: floor === 1 ? "#fff" : "#222",
            border: "1px solid #2563eb",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          1층
        </button>
        <button
          onClick={() => setFloor(2)}
          style={{
            padding: "8px 16px",
            background: floor === 2 ? "#2563eb" : "#fff",
            color: floor === 2 ? "#fff" : "#222",
            border: "1px solid #2563eb",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          2층
        </button>
      </div>
      <svg
        viewBox="0 0 1000 800"
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "5/4",
          maxHeight: "70vh",
        }}
      >
        <image
          href={floor === 1 ? "/floor1.png" : "/floor2.png"}
          width="1000"
          height="800"
        />
        {/* 상가 영역들 */}
        {shops.map((shop) => (
          <polygon
            key={shop.id}
            points={shop.points}
            fill="rgba(0,0,255,0.3)"
            stroke="#000"
            onClick={() => handleClick(shop.id)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
      {selectedShop && (
        <div
          style={{
            // marginTop: 5,
            padding: 16,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>{selectedShop.name}</h1>
          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                flex: 1,
              }}
            >
              <p>{selectedShop.description}</p>
              <p>{selectedShop.contact}</p>
            </div>

            <div style={{ width: 1, background: "#ddd" }} />

            <div style={{ flex: 1 }}>
              {selectedShop.menuImageUrl && (
                <Image
                  src={selectedShop.menuImageUrl}
                  alt={selectedShop.name}
                  width={100}
                  height={100}
                />
              )}
              {selectedShop.menuLinkUrl && (
                <a
                  href={selectedShop.menuLinkUrl}
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
          {/* <button
            onClick={() => setSelectedShop(null)}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            닫기
          </button> */}
        </div>
      )}
    </div>
  );
}
