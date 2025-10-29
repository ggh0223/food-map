import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type KakaoMedia = {
  type?: string;
  url?: string;
  xlarge_url?: string;
  large_url?: string;
  medium_url?: string;
  small_url?: string;
};

type KakaoPost = {
  id?: number;
  title?: string;
  contents?: Array<{ t?: string; v?: string }>; // text blocks
  media?: KakaoMedia[];
  created_at?: number; // ms epoch
  permalink?: string;
};

type KakaoListResponse = {
  items?: KakaoPost[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isKakaoPost(value: unknown): value is KakaoPost {
  if (!isObject(value)) return false;
  // minimal heuristic: media is array or title/contents exist
  const media = (value as Record<string, unknown>)["media"];
  const title = (value as Record<string, unknown>)["title"];
  return Array.isArray(media) || typeof title === "string";
}

function normalizePosts(raw: unknown): KakaoPost[] {
  // Case 1: { items: [...] }
  if (isObject(raw) && Array.isArray((raw as KakaoListResponse).items)) {
    const items = (raw as KakaoListResponse).items as unknown[];
    return items.filter(isKakaoPost) as KakaoPost[];
  }
  // Case 2: [...]
  if (Array.isArray(raw)) {
    return raw.filter(isKakaoPost) as KakaoPost[];
  }
  // Case 3: single object
  if (isKakaoPost(raw)) {
    return [raw as KakaoPost];
  }
  return [];
}

function toHttps(u?: string | null): string | null {
  if (!u) return null;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

function pickBest(media: KakaoMedia): string | null {
  return (
    toHttps(media.xlarge_url) ||
    toHttps(media.large_url) ||
    toHttps(media.url) ||
    toHttps(media.medium_url) ||
    toHttps(media.small_url) ||
    null
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId") || ""; // e.g. _xgUVZn
    const includePinned = searchParams.get("includePinnedPost") ?? "true";
    if (!channelId) {
      return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
    }

    const endpoint = `https://pf.kakao.com/rocket-web/web/profiles/${encodeURIComponent(
      channelId
    )}/posts?includePinnedPost=${encodeURIComponent(includePinned)}`;

    const resp = await fetch(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        referer: `https://pf.kakao.com/${encodeURIComponent(channelId)}/posts`,
        origin: "https://pf.kakao.com",
      },
      next: { revalidate },
    });

    if (!resp.ok) {
      const preview = (await resp.text()).slice(0, 400);
      return NextResponse.json(
        { error: `Kakao fetch failed: ${resp.status}`, preview },
        { status: resp.status }
      );
    }

    // 카카오 응답은 items 배열 또는 단일 객체/배열로 올 수 있음
    const raw = (await resp.json()) as unknown;
    const posts: KakaoPost[] = normalizePosts(raw);
    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No posts found", channelId },
        { status: 404 }
      );
    }

    // 최신(첫 번째) 기준으로 이미지 URL 평탄화
    const latest = posts[0] as KakaoPost;
    const images = (latest.media ?? [])
      .filter((m) => (m.type ?? "image").toLowerCase() === "image")
      .map((m) => pickBest(m))
      .filter((u): u is string => Boolean(u));

    const textBlocks = (latest.contents ?? [])
      .filter((c) => (c.t ?? "").toLowerCase() === "text")
      .map((c) => c.v ?? "");

    return NextResponse.json({
      channelId,
      title: latest.title ?? "",
      text: textBlocks.join("\n\n"),
      imageUrls: Array.from(new Set(images)),
      count: images.length,
      createdAt: latest.created_at ?? null,
      permalink: latest.permalink ?? null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
