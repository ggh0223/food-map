"use client";

import { useState } from "react";

type PageInfo = { hasNextPage?: boolean; nextCursor?: string | null };
type ApiResponse = {
  businessId: string;
  count: number;
  imageUrls: string[];
  pageInfo: PageInfo;
  error?: string;
};

export default function NaverFeedTestPage() {
  const [businessId, setBusinessId] = useState<string>("268601895");
  const [cursor, setCursor] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(targetBusinessId: string, targetCursor: string | null) {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/naver-feed?businessId=${encodeURIComponent(targetBusinessId)}${
        targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ""
      }`;
      const resp = await fetch(url);
      const json = (await resp.json()) as ApiResponse;
      if (!resp.ok) {
        throw new Error(json?.error || `요청 실패: ${resp.status}`);
      }
      setData(json);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  const urls = data?.imageUrls ?? [];
  const hasNext = !!data?.pageInfo?.hasNextPage;
  const nextCursor = data?.pageInfo?.nextCursor ?? null;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Naver Place 이미지 URL 테스트</h1>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="border rounded px-2 py-1"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          placeholder="businessId"
        />
        <button
          className="border rounded px-3 py-1"
          onClick={() => {
            setCursor(null);
            fetchData(businessId, null);
          }}
        >
          불러오기
        </button>
        {cursor && (
          <button
            className="border rounded px-3 py-1"
            onClick={() => {
              setCursor(null);
              fetchData(businessId, null);
            }}
          >
            처음으로
          </button>
        )}
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p className="text-red-600">오류: {error}</p>}

      {data && (
        <p>
          businessId: <span className="font-mono">{data.businessId}</span>, 총 {data.count}
          개
        </p>
      )}

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {urls.map((u) => (
          <li key={u} className="border rounded p-2">
            <img src={u} alt="" className="w-full h-auto rounded" loading="lazy" />
            <p className="text-xs break-all mt-2">{u}</p>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {hasNext && (
          <button
            className="border rounded px-3 py-1"
            onClick={() => {
              setCursor(nextCursor);
              fetchData(businessId, nextCursor);
            }}
          >
            다음 페이지
          </button>
        )}
      </div>
    </main>
  );
}


