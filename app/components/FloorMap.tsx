import { useState, useRef, useEffect } from "react";
import shopsData from "../data/shops.json";
import type { Shop } from "@data/interface";
import Image from "next/image";

const floorKey = (floor: number): "floor1" | "floor2" => {
  return floor === 1 ? "floor1" : "floor2";
};

// points 문자열을 배열로 변환하는 함수
function parsePoints(points: string): { x: number; y: number }[] {
  return points.split(" ").map((pt) => {
    const [x, y] = pt.split(",").map(Number);
    return { x, y };
  });
}
// 배열을 points 문자열로 변환
function pointsToString(points: { x: number; y: number }[]): string {
  return points.map((pt) => `${pt.x},${pt.y}`).join(" ");
}

function ShopInputModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    contact: string;
  }) => void;
  defaultValues?: { name: string; description: string; contact: string };
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(
    defaultValues?.description || ""
  );
  const [contact, setContact] = useState(defaultValues?.contact || "");

  // defaultValues가 바뀔 때마다 input 값 동기화
  useEffect(() => {
    setName(defaultValues?.name || "");
    setDescription(defaultValues?.description || "");
    setContact(defaultValues?.contact || "");
  }, [defaultValues]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          minWidth: 300,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>상가 정보 입력</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="상가 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
          <input
            placeholder="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
          <input
            placeholder="연락처"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#eee",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSubmit({ name, description, contact })}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FloorMap() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [floor, setFloor] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPoint, setCurrentPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [pendingPoints, setPendingPoints] = useState<string | null>(null);
  const [draggingShopId, setDraggingShopId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [shopsState, setShopsState] = useState<Shop[] | null>(null); // 임시 이동 상태
  const [resizeTarget, setResizeTarget] = useState<{
    shopId: string;
    pointIdx: number;
  } | null>(null);
  const [editShop, setEditShop] = useState<Shop | null>(null); // 수정할 상가
  const svgRef = useRef<SVGSVGElement>(null);

  // localhost 체크
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const shops: Shop[] = (shopsState ||
    shopsData[floorKey(floor)] ||
    []) as Shop[];

  const handleClick = (id: string) => {
    const shop = shops.find((s) => s.id === id);
    if (isAdminMode && shop) {
      setEditShop(shop); // 관리자 모드에서는 수정 모달 오픈
    } else {
      setSelectedShop(shop ?? null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdminMode) return; // 관리자 모드가 아닐 때는 드래그 불가
    if (e.button !== 0) return; // 좌클릭만 허용

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 1000, height: 800 };

    // SVG의 실제 크기와 viewBox의 비율 계산
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;

    // SVG가 중앙에 위치하므로 여백 계산
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;

    // 마우스 좌표를 SVG viewBox 좌표로 변환
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdminMode) return; // 관리자 모드가 아닐 때는 드래그 불가
    if (!isDrawing || !startPoint) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 1000, height: 800 };

    // SVG의 실제 크기와 viewBox의 비율 계산
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;

    // SVG가 중앙에 위치하므로 여백 계산
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;

    // 마우스 좌표를 SVG viewBox 좌표로 변환
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    setCurrentPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isAdminMode) return;
    if (!isDrawing || !startPoint || !currentPoint) return;
    // 좌표를 문자열로 변환
    const points = [
      `${Math.round(startPoint.x)},${Math.round(startPoint.y)}`,
      `${Math.round(currentPoint.x)},${Math.round(startPoint.y)}`,
      `${Math.round(currentPoint.x)},${Math.round(currentPoint.y)}`,
      `${Math.round(startPoint.x)},${Math.round(currentPoint.y)}`,
    ].join(" ");
    setPendingPoints(points);
    setShowInputModal(true);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleModalClose = () => {
    setShowInputModal(false);
    setPendingPoints(null);
  };

  const handleModalSubmit = async ({
    name,
    description,
    contact,
  }: {
    name: string;
    description: string;
    contact: string;
  }) => {
    if (!pendingPoints) return;
    const newShop: Shop = {
      id: `shop${Date.now()}`,
      points: pendingPoints,
      name,
      contact,
      description,
      menuLinkUrl: null,
      menuImageUrl: null,
      availableInLaunch: true,
      availableInDinner: true,
      floor: floor === 1 ? "floor1" : "floor2",
    };
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShop),
      });
      if (!response.ok) throw new Error("Failed to save shop");
      const result = await response.json();
      if (result.success) {
        alert("새 상가가 추가되었습니다.");
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error saving shop:", error);
      alert("상가 추가에 실패했습니다.");
    }
    setShowInputModal(false);
    setPendingPoints(null);
  };

  // polygon 클릭 시 이동 시작
  const handlePolygonMouseDown = (e: React.MouseEvent, shop: Shop) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    // 마우스 좌표를 SVG 좌표로 변환
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 1000, height: 800 };
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;
    // 첫 번째 꼭짓점과의 차이(오프셋) 저장
    const pointsArr = parsePoints(shop.points);
    setDraggingShopId(shop.id);
    setDragOffset({ x: mouseX - pointsArr[0].x, y: mouseY - pointsArr[0].y });
  };

  // SVG에서 마우스 이동 시 polygon 이동
  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdminMode) return;
    if (!draggingShopId || !dragOffset) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 1000, height: 800 };
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;
    // 이동할 거리 계산
    const shopsArr = (
      (shopsState || shopsData[floorKey(floor)] || []) as Shop[]
    ).map((shop) => {
      if (shop.id !== draggingShopId) return shop;
      const pointsArr = parsePoints(shop.points);
      // 첫 꼭짓점 기준으로 전체 이동
      const dx = mouseX - dragOffset.x - pointsArr[0].x;
      const dy = mouseY - dragOffset.y - pointsArr[0].y;
      const moved = pointsArr.map((pt) => ({
        x: Math.round(pt.x + dx),
        y: Math.round(pt.y + dy),
      }));
      return {
        ...shop,
        points: pointsToString(moved),
      };
    });
    setShopsState(shopsArr);
  };

  // 마우스 업 시 이동 종료 및 저장
  const handleSVGMouseUp = async () => {
    if (!isAdminMode) return;
    if (!draggingShopId) return;
    // 이동된 shop만 PATCH
    const movedShop = (shopsState || []).find((s) => s.id === draggingShopId);
    if (movedShop) {
      try {
        await fetch("/api/shops", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movedShop),
        });
        // shopsState를 최신값으로 유지 (이미 이동된 상태)
      } catch {
        alert("이동 저장 실패");
      }
    }
    setDraggingShopId(null);
    setDragOffset(null);
    // setShopsState(null); // 상태 유지
  };

  // 핸들 드래그 시작
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    shop: Shop,
    pointIdx: number
  ) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setResizeTarget({ shopId: shop.id, pointIdx });
  };

  // 핸들 드래그 중
  const handleSVGResizeMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdminMode) return;
    if (!resizeTarget) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 1000, height: 800 };
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;
    const shopsArr = (
      (shopsState || shopsData[floorKey(floor)] || []) as Shop[]
    ).map((shop) => {
      if (shop.id !== resizeTarget.shopId) return shop;
      const pointsArr = parsePoints(shop.points);
      // 직사각형 유지: points[0] 고정, 나머지 꼭짓점 자동 계산
      const p0 = pointsArr[0];
      const newX = Math.round(mouseX);
      const newY = Math.round(mouseY);
      const newPoints = [
        p0,
        { x: newX, y: p0.y },
        { x: newX, y: newY },
        { x: p0.x, y: newY },
      ];
      return { ...shop, points: pointsToString(newPoints) };
    });
    setShopsState(shopsArr);
  };

  // 핸들 드래그 종료
  const handleSVGResizeUp = async () => {
    if (!isAdminMode) return;
    if (!resizeTarget) return;
    const resizedShop = (shopsState || []).find(
      (s) => s.id === resizeTarget.shopId
    );
    if (resizedShop) {
      try {
        await fetch("/api/shops", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resizedShop),
        });
        // shopsState를 최신값으로 유지 (이미 리사이즈된 상태)
      } catch {
        alert("확장/축소 저장 실패");
      }
    }
    setResizeTarget(null);
    // setShopsState(null); // 상태 유지
  };

  // 층 변경 시 shopsState 초기화
  const handleFloorChange = (newFloor: number) => {
    setFloor(newFloor);
    setShopsState(null); // 임시 데이터 초기화
  };

  // 관리자 모드 토글 시 shopsState 초기화
  const handleAdminModeToggle = () => {
    setIsAdminMode((prev) => {
      if (prev) setShopsState(null); // 끌 때 초기화
      return !prev;
    });
  };

  // 수정 모달 닫기
  const handleEditModalClose = () => {
    setEditShop(null);
  };

  // 수정 모달 확인
  const handleEditModalSubmit = async ({
    name,
    description,
    contact,
  }: {
    name: string;
    description: string;
    contact: string;
  }) => {
    if (!editShop) return;
    const updatedShop: Shop = {
      ...editShop,
      name,
      description,
      contact,
    };
    try {
      const response = await fetch("/api/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedShop),
      });
      if (!response.ok) throw new Error("Failed to update shop");
      // shopsState 갱신
      setShopsState((prev) =>
        (prev || shops).map((s) => (s.id === updatedShop.id ? updatedShop : s))
      );
      setEditShop(null);
    } catch (error) {
      console.error(error);
      alert("상가 정보 수정에 실패했습니다.");
    }
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
      {/* 관리자 모드 토글 버튼 - localhost에서만 표시 */}
      {isLocalhost && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={handleAdminModeToggle}
            style={{
              padding: "8px 16px",
              background: isAdminMode ? "#dc2626" : "#fff",
              color: isAdminMode ? "#fff" : "#222",
              border: "1px solid #dc2626",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isAdminMode ? "관리자 모드 끄기" : "관리자 모드 켜기"}
          </button>
        </div>
      )}
      {/* 층 선택 버튼 */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => handleFloorChange(1)}
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
          onClick={() => handleFloorChange(2)}
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
        ref={svgRef}
        viewBox="0 0 1000 800"
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "5/4",
          maxHeight: "70vh",
          cursor: isAdminMode
            ? isDrawing
              ? "crosshair"
              : draggingShopId
              ? "move"
              : resizeTarget
              ? "nwse-resize"
              : "pointer"
            : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleSVGMouseMove(e);
          handleSVGResizeMove(e);
        }}
        onMouseUp={() => {
          handleMouseUp();
          handleSVGMouseUp();
          handleSVGResizeUp();
        }}
        onMouseLeave={() => {
          handleMouseUp();
          handleSVGMouseUp();
          handleSVGResizeUp();
        }}
      >
        <image
          href={floor === 1 ? "/floor1.png" : "/floor2.png"}
          width="1000"
          height="800"
          preserveAspectRatio="xMidYMid meet"
        />
        {/* 상가 영역들 */}
        {shops.map((shop) => {
          const pointsArr = parsePoints(shop.points);
          return (
            <g key={shop.id}>
              <polygon
                points={shop.points}
                fill="rgba(0,0,255,0.3)"
                stroke="#000"
                onClick={() => handleClick(shop.id)}
                onMouseDown={(e) => handlePolygonMouseDown(e, shop)}
                style={{ cursor: isAdminMode ? "move" : "pointer" }}
              />
              {/* 오른쪽 하단 꼭짓점 핸들 */}
              {isAdminMode && pointsArr.length > 0 && (
                <circle
                  cx={pointsArr[2].x}
                  cy={pointsArr[2].y}
                  r={12}
                  fill="#fff"
                  stroke="#2563eb"
                  strokeWidth={2}
                  style={{ cursor: "nwse-resize" }}
                  onMouseDown={(e) => handleResizeHandleMouseDown(e, shop, 2)}
                />
              )}
            </g>
          );
        })}
        {/* 드래그 중인 영역 표시 */}
        {isDrawing && startPoint && currentPoint && (
          <rect
            x={Math.min(startPoint.x, currentPoint.x)}
            y={Math.min(startPoint.y, currentPoint.y)}
            width={Math.abs(currentPoint.x - startPoint.x)}
            height={Math.abs(currentPoint.y - startPoint.y)}
            fill="rgba(255,0,0,0.2)"
            stroke="red"
            strokeWidth="2"
          />
        )}
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
      <ShopInputModal
        open={showInputModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
      {/* 상가 정보 수정 모달 (관리자 모드) */}
      <ShopInputModal
        open={!!editShop}
        onClose={handleEditModalClose}
        onSubmit={handleEditModalSubmit}
        defaultValues={
          editShop
            ? {
                name: editShop.name,
                description: editShop.description,
                contact: editShop.contact,
              }
            : undefined
        }
      />
    </div>
  );
}
