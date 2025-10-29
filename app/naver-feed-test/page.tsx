"use client";

import { useState } from "react";

// 최신 메뉴 추출 전용 페이지

export default function NaverFeedTestPage() {
  const [businessId, setBusinessId] = useState<string>("268601895");
  const [suffix, setSuffix] = useState<string>("feed");
  const [cookie, setCookie] = useState<string>("");

  const [latest, setLatest] = useState<{
    feedId: number | null;
    id: string | null;
    createdString: string | null;
    title: string;
    desc: string;
    imageUrls: string[];
    count: number;
  } | null>(null);
  const [latestLoading, setLatestLoading] = useState<boolean>(false);
  const [latestError, setLatestError] = useState<string | null>(null);

  // Kakao HTML 테스트용 상태
  const [kakaoUrl, setKakaoUrl] = useState<string>(
    "https://pf.kakao.com/_xgUVZn/posts"
  );
  const [kakaoCookie, setKakaoCookie] = useState<string>("");
  const [kakaoHtml, setKakaoHtml] = useState<string>("");
  const [kakaoLoading, setKakaoLoading] = useState<boolean>(false);
  const [kakaoError, setKakaoError] = useState<string | null>(null);
  const [kakaoImages, setKakaoImages] = useState<string[]>([]);

  // 불필요한 오래된 테스트(fetchData, fetchHtml) 제거

  async function fetchLatest() {
    try {
      setLatestLoading(true);
      setLatestError(null);
      setLatest(null);
      const url = `/api/naver-latest-feed?businessId=${encodeURIComponent(
        businessId
      )}&suffix=${encodeURIComponent(suffix)}${
        cookie ? `&cookie=${encodeURIComponent(cookie)}` : ""
      }`;
      const resp = await fetch(url, { cache: "no-store" });
      const json = await resp.json();
      console.log("[naver-latest-feed] response", json);
      if (!resp.ok) {
        throw new Error(json?.error || `요청 실패: ${resp.status}`);
      }
      setLatest(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLatestError(message);
    } finally {
      setLatestLoading(false);
    }
  }

  async function fetchKakaoHtml() {
    try {
      setKakaoLoading(true);
      setKakaoError(null);
      setKakaoHtml("");
      const url = `/api/kakao-html?url=${encodeURIComponent(kakaoUrl)}${
        kakaoCookie ? `&cookie=${encodeURIComponent(kakaoCookie)}` : ""
      }`;
      const resp = await fetch(url, { cache: "no-store" });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`요청 실패: ${resp.status}`);
      setKakaoHtml(text);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setKakaoError(message);
    } finally {
      setKakaoLoading(false);
    }
  }

  async function fetchKakaoImages() {
    try {
      setKakaoLoading(true);
      setKakaoError(null);
      setKakaoImages([]);
      const channelId =
        kakaoUrl.split("/").find((s) => s.startsWith("_")) || "_xgUVZn";
      const url = `/api/kakao-feed?channelId=${encodeURIComponent(channelId)}`;
      const resp = await fetch(url, { cache: "no-store" });
      const json = await resp.json();
      console.log("[kakao-feed] response", json);
      if (!resp.ok) throw new Error(json?.error || `요청 실패: ${resp.status}`);
      setKakaoImages(Array.isArray(json?.imageUrls) ? json.imageUrls : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setKakaoError(message);
    } finally {
      setKakaoLoading(false);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Naver Place 최신 메뉴 테스트</h1>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="border rounded px-2 py-1"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          placeholder="businessId"
        />
      </div>

      <section className="space-y-3 border-t pt-4 mt-2">
        <h2 className="text-xl font-semibold">요청 설정</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm">suffix</label>
          <input
            className="border rounded px-2 py-1"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="feed"
          />
          <button className="border rounded px-3 py-1" onClick={fetchLatest}>
            최신 메뉴 가져오기
          </button>
          <a
            className="underline text-blue-600 text-sm"
            href={`/api/naver-latest-feed?businessId=${encodeURIComponent(
              businessId
            )}&suffix=${encodeURIComponent(suffix)}`}
            target="_blank"
            rel="noreferrer"
          >
            API 결과 열기
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">cookie (선택)</label>
          <textarea
            className="border rounded px-2 py-1 min-h-[72px]"
            placeholder="NID_AUT=...; NID_SES=...; ..."
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3 border-t pt-4 mt-2">
        <h2 className="text-xl font-semibold">Kakao HTML 원문 테스트</h2>
        <div className="flex flex-col gap-2">
          <input
            className="border rounded px-2 py-1"
            value={kakaoUrl}
            onChange={(e) => setKakaoUrl(e.target.value)}
            placeholder="https://pf.kakao.com/_.../posts"
          />
          <textarea
            className="border rounded px-2 py-1 min-h-[72px]"
            placeholder="cookie (선택): KAKAO 쿠키 문자열"
            value={kakaoCookie}
            onChange={(e) => setKakaoCookie(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <button
              className="border rounded px-3 py-1"
              onClick={fetchKakaoHtml}
            >
              HTML 가져오기
            </button>
            <button
              className="border rounded px-3 py-1"
              onClick={fetchKakaoImages}
            >
              이미지 URL 추출
            </button>
            <a
              className="underline text-blue-600 text-sm"
              href={`/api/kakao-html?url=${encodeURIComponent(kakaoUrl)}`}
              target="_blank"
              rel="noreferrer"
            >
              새 탭에서 열기
            </a>
          </div>
        </div>
        {kakaoLoading && <p>HTML 불러오는 중...</p>}
        {kakaoError && <p className="text-red-600">오류: {kakaoError}</p>}
        {kakaoHtml && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">길이: {kakaoHtml.length}자</p>
            <pre className="text-xs whitespace-pre-wrap break-words border rounded p-2 max-h-[400px] overflow-auto">
              {kakaoHtml}
            </pre>
          </div>
        )}
        {kakaoImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              이미지 {kakaoImages.length}개
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kakaoImages.map((u) => (
                <li key={u} className="border rounded p-2">
                  <img
                    src={u}
                    alt=""
                    className="w-full h-auto rounded"
                    loading="lazy"
                  />
                  <p className="text-xs break-all mt-2">{u}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3 border-t pt-4 mt-2">
        <h2 className="text-xl font-semibold">최신 메뉴 결과</h2>
        {latestLoading && <p>불러오는 중...</p>}
        {latestError && <p className="text-red-600">오류: {latestError}</p>}
        {latest && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              날짜: {latest.createdString || "-"} / feedId:{" "}
              {latest.feedId || "-"}
            </p>
            <h3 className="text-lg font-semibold">{latest.title}</h3>
            <pre className="whitespace-pre-wrap text-sm border rounded p-2">
              {latest.desc}
            </pre>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {latest.imageUrls.map((u: string) => (
                <li key={u} className="border rounded p-2">
                  <img
                    src={u}
                    alt=""
                    className="w-full h-auto rounded"
                    loading="lazy"
                  />
                  <p className="text-xs break-all mt-2">{u}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
