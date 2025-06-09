import { useState, useRef } from "react";
import shopsData from "../data/shops.json";
import type { Shop } from "@data/interface";
import ShopInputModal from "./ShopInputModal";
import ShopInfo from "./ShopInfo";
import ShopList from "./ShopList";

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

export default function FloorMap() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDrawerClosed, setIsDrawerClosed] = useState(false);
  const [floor, setFloor] = useState(1);
  const [filters, setFilters] = useState({
    launch: true,
    dinner: true,
    type: "전체" as "전체" | Shop["type"],
  });
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
  const [shopsState, setShopsState] = useState<Shop[] | null>(null);
  const [resizeTarget, setResizeTarget] = useState<{
    shopId: string;
    pointIdx: number;
  } | null>(null);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 개발 환경에서만 관리자 모드 토글 버튼 표시
  const isDevelopment = process.env.NODE_ENV === "development";

  const shops: Shop[] = (shopsState ||
    shopsData[floorKey(floor)] ||
    []) as Shop[];

  const filteredShops = shops.filter((shop) => {
    // 시간대 필터링
    const timeFilter =
      (filters.launch && shop.availableInLaunch) ||
      (filters.dinner && shop.availableInDinner);

    // 음식 타입 필터링
    const typeFilter = filters.type === "전체" || shop.type === filters.type;

    return timeFilter && typeFilter;
  });

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDrawerClosed(false);
  };

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
      logoUrl: "",
      contact,
      type: "한식",
      description,
      menuLinkUrl: null,
      menuList: null,
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
    const shopsArr = (shopsState || shopsData[floorKey(floor)] || []) as Shop[];
    const moved = shopsArr.map((shop) => {
      if (shop.id !== draggingShopId) return shop;
      const pointsArr = parsePoints(shop.points);
      // 첫 꼭짓점 기준으로 전체 이동
      const dx = mouseX - dragOffset.x - pointsArr[0].x;
      const dy = mouseY - dragOffset.y - pointsArr[0].y;
      const movedPoints = pointsArr.map((pt) => ({
        x: Math.round(pt.x + dx),
        y: Math.round(pt.y + dy),
      }));
      return {
        ...shop,
        points: pointsToString(movedPoints),
      };
    });
    setShopsState(moved);
  };

  // 마우스 업 시 이동 종료 및 저장
  const handleSVGMouseUp = async () => {
    if (!isAdminMode) return;
    if (!draggingShopId) return;
    // 이동된 shop만 PATCH
    const movedShop = (shopsState ||
      shopsData[floorKey(floor)] ||
      []) as Shop[];
    if (movedShop.length > 0) {
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
    const shopsArr = (shopsState || shopsData[floorKey(floor)] || []) as Shop[];
    const resized = shopsArr.map((shop) => {
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
    setShopsState(resized);
  };

  // 핸들 드래그 종료
  const handleSVGResizeUp = async () => {
    if (!isAdminMode) return;
    if (!resizeTarget) return;
    const resizedShop = (shopsState ||
      shopsData[floorKey(floor)] ||
      []) as Shop[];
    if (resizedShop.length > 0) {
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
        margin: "0 auto",
        padding: "0px 20px",
        color: "var(--text-color)",
      }}
    >
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
          // filter: "var(--svg-filter)",
          background: "#fff",
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
        {/* 화살표 애니메이션 스타일 */}
        <svg style={{ display: "none" }}>
          <style>{`
            .arrow-bounce {
              animation: arrow-bounce 1s infinite alternate cubic-bezier(.4,0,.2,1);
            }
            @keyframes arrow-bounce {
              0% { transform: translateY(0); }
              100% { transform: translateY(12px); }
            }
          `}</style>
        </svg>
        {shops.map((shop) => {
          const pointsArr = parsePoints(shop.points);
          // 상단 중앙 좌표 계산 (pointsArr[0]과 pointsArr[1]의 중간)
          const arrowX = (pointsArr[0].x + pointsArr[1].x) / 2;
          const arrowY = Math.min(pointsArr[0].y, pointsArr[1].y) - 14; // polygon 위에 약간 띄워서
          return (
            <g key={shop.id}>
              <polygon
                points={shop.points}
                fill={
                  selectedShop?.id === shop.id
                    ? "rgba(37, 99, 235, 0.3)"
                    : isAdminMode
                    ? "rgba(0,0,255,0.3)"
                    : "rgba(255, 255, 255, 0)"
                }
                stroke={selectedShop?.id === shop.id ? "#2563eb" : "none"}
                strokeWidth={2}
                onClick={() => handleClick(shop.id)}
              />
              {/* 선택된 가게의 상단 중앙에 빨간색 ▼ 표시 */}
              {selectedShop?.id === shop.id && (
                <text
                  x={arrowX}
                  y={arrowY}
                  textAnchor="middle"
                  fontSize="56"
                  fontWeight="bold"
                  fill="#e11d48"
                  className="arrow-bounce"
                  style={{ pointerEvents: "none" }}
                >
                  ▼
                </text>
              )}
              <image
                href={shop.logoUrl ? shop.logoUrl : "/icon-192x192.png"}
                x={(pointsArr[0].x + pointsArr[2].x) / 2 - 15}
                y={(pointsArr[0].y + pointsArr[2].y) / 2 - 15}
                width={30}
                height={30}
                onClick={() => handleClick(shop.id)}
                onMouseDown={(e) => handlePolygonMouseDown(e, shop)}
                style={{
                  cursor: isAdminMode ? "move" : "pointer",
                  filter:
                    selectedShop?.id === shop.id
                      ? "drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))"
                      : "none",
                }}
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

      {/* 층 선택 버튼 */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        {selectedShop && isDrawerClosed && (
          <button
            onClick={() => setIsDrawerClosed(false)}
            style={{
              position: "fixed",
              left: 0,
              background: "var(--card-bg)",
              border: "none",
              borderRight: "1px solid var(--border-color)",
              padding: "8px 16px",
              cursor: "pointer",
              boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
              zIndex: 998,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-color)",
            }}
          >
            <span>{selectedShop.name}</span>
            <span>▶</span>
          </button>
        )}
        <button
          onClick={() => handleFloorChange(1)}
          style={{
            padding: "8px 16px",
            background: floor === 1 ? "#2563eb" : "var(--button-bg)",
            color: floor === 1 ? "#fff" : "var(--button-text)",
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
            background: floor === 2 ? "#2563eb" : "var(--button-bg)",
            color: floor === 2 ? "#fff" : "var(--button-text)",
            border: "1px solid #2563eb",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          2층
        </button>
        {isDevelopment && (
          <button
            onClick={handleAdminModeToggle}
            style={{
              padding: "8px 16px",
              background: isAdminMode ? "#dc2626" : "var(--button-bg)",
              color: isAdminMode ? "#fff" : "var(--button-text)",
              border: "1px solid #dc2626",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isAdminMode ? "관리자" : "관리자"}
          </button>
        )}
      </div>

      <ShopList
        shops={filteredShops}
        selectedShop={selectedShop}
        onShopSelect={handleShopSelect}
        floor={floor}
        filters={filters}
        onFilterChange={setFilters}
      />

      {selectedShop && (
        <ShopInfo
          shop={selectedShop}
          onClose={() => setIsDrawerClosed(true)}
          onReopen={() => setIsDrawerClosed(false)}
          isClosed={isDrawerClosed}
        />
      )}

      <ShopInputModal
        open={showInputModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
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
