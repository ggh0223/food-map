"use client";

import { useState, useRef, useEffect } from "react";

// 임시 데이터
const FLOORS: Record<
  number,
  {
    name: string;
    restaurants: {
      id: number;
      name: string;
      position: { x: number; y: number };
    }[];
  }
> = {
  1: {
    name: "1층",
    restaurants: [
      { id: 1, name: "맛있는 식당", position: { x: 200, y: 200 } },
      { id: 2, name: "좋은 식당", position: { x: 400, y: 150 } },
    ],
  },
  2: {
    name: "2층",
    restaurants: [
      { id: 3, name: "맛집", position: { x: 300, y: 300 } },
      { id: 4, name: "분식", position: { x: 500, y: 250 } },
    ],
  },
};

export default function Home() {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    // SVG 내부 영역인지 확인
    const svgRect = containerRef.current
      ?.querySelector("svg")
      ?.getBoundingClientRect();
    if (svgRect) {
      const x = (clientX - svgRect.left) / scale;
      const y = (clientY - svgRect.top) / scale;

      // 건물 영역 내부인지 확인
      const padding = 40;
      if (
        x >= padding &&
        x <= svgRect.width / scale - padding &&
        y >= padding &&
        y <= svgRect.height / scale - padding
      ) {
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
      }
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging) {
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(2, scale * delta));
    setScale(newScale);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  // SVG 크기 계산
  const svgWidth = Math.max(containerSize.width, 800);
  const svgHeight = Math.max(containerSize.height, 600);
  const padding = 40; // 경계선과의 여백

  // ㄱ자 모양 건물 경로 계산
  const buildingPath = `
    M ${padding} ${padding}
    h ${svgWidth - padding * 2}
    v ${svgHeight - padding * 2}
    h -${(svgWidth - padding * 2) * 0.4}
    v -${(svgHeight - padding * 2) * 0.6}
    h -${(svgWidth - padding * 2) * 0.6}
    Z
  `;

  // 내부 구역 경로 계산
  const innerPath = `
    M ${padding * 2} ${padding * 2}
    h ${(svgWidth - padding * 4) * 0.8}
    v ${(svgHeight - padding * 4) * 0.8}
    h -${(svgWidth - padding * 4) * 0.4}
    v -${(svgHeight - padding * 4) * 0.6}
    h -${(svgWidth - padding * 4) * 0.4}
    Z
  `;

  return (
    <main className="h-screen w-full relative overflow-hidden bg-gray-100">
      {/* 층 선택 버튼 */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {Object.entries(FLOORS).map(([floor, data]) => (
          <button
            key={floor}
            onClick={() => setCurrentFloor(Number(floor))}
            className={`px-4 py-2 rounded-lg shadow-md ${
              currentFloor === Number(floor)
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {data.name}
          </button>
        ))}
      </div>

      {/* 도면 뷰 */}
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 건물 외곽선 */}
          <g className="building-outline">
            {/* 메인 건물 */}
            <path d={buildingPath} fill="none" stroke="#333" strokeWidth="4" />

            {/* 내부 구역 */}
            <path
              d={innerPath}
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* 주요 통로 */}
            <path
              d={`M ${svgWidth * 0.4} ${padding * 2} L ${svgWidth * 0.4} ${
                svgHeight - padding * 2
              }`}
              fill="none"
              stroke="#666"
              strokeWidth="3"
            />
            <path
              d={`M ${padding * 2} ${svgHeight * 0.4} L ${
                svgWidth - padding * 2
              } ${svgHeight * 0.4}`}
              fill="none"
              stroke="#666"
              strokeWidth="3"
            />
          </g>

          {/* 레스토랑 마커 */}
          {FLOORS[currentFloor as number].restaurants.map((restaurant) => (
            <g key={restaurant.id} className="restaurant-marker">
              <circle
                cx={restaurant.position.x}
                cy={restaurant.position.y}
                r="8"
                fill="#ff4444"
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={restaurant.position.x + 15}
                y={restaurant.position.y + 5}
                className="text-sm font-medium"
                fill="#333"
              >
                {restaurant.name}
              </text>
            </g>
          ))}

          {/* 드래그 안내 텍스트 */}
          <text
            x={svgWidth / 2}
            y={svgHeight / 2}
            textAnchor="middle"
            className="text-lg font-medium"
            fill="#999"
            style={{ pointerEvents: "none" }}
          >
            {isDragging ? "드래그 중..." : "건물 영역을 드래그하여 이동"}
          </text>
        </svg>
      </div>

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1.1)}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-xl"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(0.9)}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-xl"
        >
          -
        </button>
      </div>
    </main>
  );
}
