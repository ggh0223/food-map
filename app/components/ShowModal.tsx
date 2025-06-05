import type { Shop } from "@data/interface";
import Image from "next/image";

export default function ShopModal({
  shop,
  onClose,
}: {
  shop: Shop;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 312,
        right: 370,
        background: "#fff",
        padding: "20px",
        border: "2px solid #ddd",
        zIndex: 1000,
        borderRadius: 10,
        height: 250,
        width: 200,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>{shop.name}</h1>
      <p>{shop.description}</p>
      <p>{shop.contact}</p>
      <p>{shop.menuLinkUrl}</p>
      {shop.menuImageUrl && (
        <Image
          src={shop.menuImageUrl}
          alt={shop.name}
          width={200}
          height={200}
        />
      )}

      <button onClick={onClose}>닫기</button>
    </div>
  );
}
