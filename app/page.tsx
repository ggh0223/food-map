"use client";

import FloorMap from "@components/FloorMap";

export default function Home() {
  // overflow-hidden 추가
  return (
    <main className="h-screen w-full relative bg-gray-100">
      <FloorMap />
    </main>
  );
}
