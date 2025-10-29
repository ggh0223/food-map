import type { Shop } from "@data/interface";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ShopInfoProps {
  shop: Shop;
  onClose: () => void;
  onReopen: () => void;
  isClosed: boolean;
}

export default function ShopInfo({ shop, onClose, isClosed }: ShopInfoProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [latest, setLatest] = useState<{
    title: string;
    desc: string;
    imageUrls: string[];
    createdString: string | null;
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  useEffect(() => {
    if (!isClosed) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [isClosed]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLatestLoading(true);
        setLatestError(null);
        setLatest(null);

        // 1) 네이버 우선
        if (shop.naverBusinessId) {
          const url = `/api/naver-latest-feed?businessId=${encodeURIComponent(
            shop.naverBusinessId
          )}&suffix=feed`;
          const resp = await fetch(url, { cache: "no-store" });
          const json = await resp.json();
          if (!resp.ok)
            throw new Error(json?.error || `요청 실패: ${resp.status}`);
          if (!aborted) {
            setLatest({
              title: json?.title ?? "",
              desc: json?.desc ?? "",
              imageUrls: Array.isArray(json?.imageUrls) ? json.imageUrls : [],
              createdString: json?.createdString ?? null,
            });
          }
          return;
        }

        // 2) 카카오(메뉴 링크에서 채널 ID 추출)
        const maybeUrl = shop.menuLinkUrl || "";
        if (maybeUrl.includes("pf.kakao.com")) {
          const parts = maybeUrl.split("/");
          const channelId = parts.find((s) => s.startsWith("_"));
          if (!channelId) throw new Error("카카오 채널 ID를 찾을 수 없습니다.");
          const url = `/api/kakao-feed?channelId=${encodeURIComponent(
            channelId
          )}`;
          const resp = await fetch(url, { cache: "no-store" });
          const json = await resp.json();
          console.log("[kakao-feed] response", json);
          if (!resp.ok)
            throw new Error(json?.error || `요청 실패: ${resp.status}`);
          if (!aborted) {
            setLatest({
              title: json?.title ?? "",
              desc: json?.text ?? "",
              imageUrls: Array.isArray(json?.imageUrls) ? json.imageUrls : [],
              createdString: null,
            });
          }
          return;
        }

        // 3) 소스 없음
        throw new Error("연결된 메뉴 소스가 없습니다.");
      } catch (e) {
        if (!aborted) {
          const message = e instanceof Error ? e.message : String(e);
          setLatestError(message);
        }
      } finally {
        if (!aborted) setLatestLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [shop.naverBusinessId, shop.menuLinkUrl]);

  useEffect(() => {
    // 이미지 목록이 바뀌면 첫 장으로 초기화
    setCurrentIndex(0);
  }, [latest?.imageUrls]);

  useEffect(() => {
    // 좌우 방향키 이동 지원
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // handlePrev/handleNext는 최신 state를 내부에서 읽으므로 의존성에 포함하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.imageUrls, currentIndex]);

  const handlePrev = () => {
    const list = latest?.imageUrls || [];
    if (list.length === 0) return;
    setCurrentIndex((idx) => (idx - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    const list = latest?.imageUrls || [];
    if (list.length === 0) return;
    setCurrentIndex((idx) => (idx + 1) % list.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(dx);
  };

  const onTouchEnd = () => {
    const threshold = 50; // px
    if (touchDeltaX > threshold) {
      handlePrev();
    } else if (touchDeltaX < -threshold) {
      handleNext();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsVisible(false);
    }, 300);
  };

  if (isClosed) {
    return null;
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                borderBottom: "2px solid var(--border-color)",
                paddingBottom: "8px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--text-color)",
                }}
              >
                연락처: {shop.contact}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              borderBottom: "2px solid var(--border-color)",
              paddingBottom: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-color)",
              }}
            >
              메뉴
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {latestLoading && (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                최신 메뉴 불러오는 중...
              </p>
            )}
            {latestError && (
              <p style={{ color: "#dc2626", fontSize: "14px" }}>
                오류: {latestError}
              </p>
            )}
            {latest?.imageUrls?.length ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "125%",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Image
                    src={latest.imageUrls[currentIndex]}
                    alt=""
                    fill
                    sizes="300px"
                    quality={90}
                    style={{ objectFit: "cover" }}
                  />
                  {/* 좌우 네비게이션 버튼 */}
                  <button
                    onClick={handlePrev}
                    aria-label="previous"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "8px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "9999px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="next"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "8px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "9999px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                  >
                    ›
                  </button>
                  {/* 인디케이터 */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      borderRadius: "9999px",
                      padding: "2px 8px",
                      fontSize: "12px",
                    }}
                  >
                    {currentIndex + 1} / {latest.imageUrls.length}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {shop.menuList && shop.menuList.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "8px 0",
                height: "calc(100vh - 450px)",
                overflowY: "auto",
              }}
            >
              {shop.menuList.map((menu) => (
                <div
                  key={menu.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--card-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      color: "var(--text-color)",
                      fontWeight: 500,
                    }}
                  >
                    {menu.name}
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#2563eb",
                      fontWeight: 600,
                    }}
                  >
                    {menu.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )}
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
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              메뉴 보기
            </a>
          )}
        </div>
      </div>
    </>
  );
}
