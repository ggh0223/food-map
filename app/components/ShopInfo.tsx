import type { Shop } from "@data/interface";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ShopInfoProps {
  shop: Shop;
  onClose: () => void;
  onReopen: () => void;
  isClosed: boolean;
}

export default function ShopInfo({
  shop,
  onClose,
  onReopen,
  isClosed,
}: ShopInfoProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isClosed) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [isClosed]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsVisible(false);
    }, 300);
  };

  if (isClosed) {
    return (
      <button
        onClick={onReopen}
        style={{
          position: "fixed",
          left: 0,
          top: "42%",
          transform: "translateY(-50%)",
          background: "var(--card-bg)",
          border: "none",
          borderRight: "1px solid var(--border-color)",
          padding: "12px",
          cursor: "pointer",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 998,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-color)",
        }}
      >
        {/* <span style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
          {shop.name}
        </span> */}
        <span>▶</span>
      </button>
    );
  }

  return (
    <>
      {/* 딤 처리된 배경 */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          opacity: isVisible ? (isClosing ? 0 : 1) : 0,
          transition: "opacity 0.3s ease-in-out",
          zIndex: 999,
        }}
      />
      {/* 드로어 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "300px",
          background: "var(--card-bg)",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          transform: isVisible
            ? isClosing
              ? "translateX(-100%)"
              : "translateX(0%)"
            : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          zIndex: 1000,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text-color)",
            }}
          >
            {shop.name}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--text-color)",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Image
            src={shop.logoUrl || "/icon-192x192.png"}
            alt={shop.name}
            width={120}
            height={120}
            style={{ borderRadius: "12px", marginBottom: "16px" }}
          />
          <p style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>
            {shop.description}
          </p>
          <p style={{ color: "var(--text-color)", fontWeight: 500 }}>
            연락처: {shop.contact}
          </p>
        </div>

        {shop.menuLinkUrl && (
          <a
            href={shop.menuLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#2563eb",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              marginTop: "auto",
            }}
          >
            메뉴 보기
          </a>
        )}
      </div>
    </>
  );
}
