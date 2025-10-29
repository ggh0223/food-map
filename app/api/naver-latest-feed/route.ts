import { NextResponse } from "next/server";
// 파일 스냅샷 저장은 배포 환경(Vercel)에서 불가하므로 제거

export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

type FeedMedia = {
  __typename?: string;
  mediaType?: string;
  thumbnail?: string;
};

type FeedItem = {
  __typename?: string;
  id?: string;
  feedId?: number;
  title?: string;
  desc?: string;
  createdString?: string; // YYYYMMDD
  isDeleted?: boolean;
  thumbnail?: { url?: string; isVideo?: boolean } | null;
  media?: FeedMedia[] | null;
};

function unescapeJsonStringLiteral(str: string): string {
  // 역슬래시 이스케이프 제거
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\\\/g, "\\")
    .replace(/\\\"/g, '"');
}

function extractJsonAfterMarker(html: string, marker: string): unknown | null {
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  let i = idx + marker.length;
  // skip spaces
  while (i < html.length && /\s/.test(html[i]!)) i++;
  // handle JSON.parse("...") wrapper
  if (html.slice(i, i + 12) === 'JSON.parse("') {
    const start = i + 12;
    const end = html.indexOf('")', start);
    if (end > start) {
      const rawStr = html.slice(start, end);
      try {
        const jsonText = unescapeJsonStringLiteral(rawStr);
        return JSON.parse(jsonText);
      } catch {
        return null;
      }
    }
  }

  // else expect raw JSON starting with { or [ and ending before </script>
  while (i < html.length && html[i] !== "{" && html[i] !== "[") i++;
  if (i >= html.length) return null;
  const start = i;
  let depth = 0;
  let inString = false;
  let prevChar = "";
  for (let j = start; j < html.length; j++) {
    const ch = html[j]!;
    if (inString) {
      if (ch === '"' && prevChar !== "\\") inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) {
          const raw = html.slice(start, j + 1);
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        }
      }
    }
    prevChar = ch;
  }
  return null;
}

function extractApolloState(html: string): Record<string, unknown> | null {
  // 1) window.__APOLLO_STATE__
  const apollo = extractJsonAfterMarker(html, "window.__APOLLO_STATE__=");
  if (apollo && typeof apollo === "object")
    return apollo as Record<string, unknown>;

  // 2) __NEXT_DATA__ script
  const idIdx = html.indexOf('id="__NEXT_DATA__"');
  if (idIdx >= 0) {
    // find start tag end '>' and closing script
    const tagStart = html.lastIndexOf("<script", idIdx);
    const tagEnd = html.indexOf(">", idIdx);
    const closeIdx = html.indexOf("</script>", tagEnd);
    if (tagStart >= 0 && tagEnd > tagStart && closeIdx > tagEnd) {
      const jsonText = html.slice(tagEnd + 1, closeIdx);
      try {
        const nextData = JSON.parse(jsonText);
        // 일부 페이지는 apollo 상태가 포함되거나, pageProps 내에 응답 JSON이 중첩됨
        // 최종적으로 Feed 객체는 깊은 탐색으로 찾는다
        return nextData as Record<string, unknown>;
      } catch {
        // ignore
      }
    }
  }

  // 3) Fallback: __APOLLO_STATE__ 문자열이 있으나 래핑된 경우 전체에서 균형 괄호 파싱
  const alt = extractJsonAfterMarker(html, "__APOLLO_STATE__");
  if (alt && typeof alt === "object") return alt as Record<string, unknown>;

  return null;
}

function collectFeedsDeep(value: unknown, out: FeedItem[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const v of value) collectFeedsDeep(v, out);
    return;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ((obj.__typename as string | undefined) === "Feed") {
      out.push(obj as unknown as FeedItem);
    }
    for (const v of Object.values(obj)) collectFeedsDeep(v, out);
  }
}

function selectLatestFeed(root: Record<string, unknown>): FeedItem | null {
  const feeds: FeedItem[] = [];
  const values = Object.values(root);
  for (const v of values) collectFeedsDeep(v, feeds);
  const filtered = feeds.filter((f) => f && f.isDeleted !== true);
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => {
    const aDate = Number(a.createdString ?? 0);
    const bDate = Number(b.createdString ?? 0);
    if (aDate !== bDate) return bDate - aDate;
    const aId = Number(a.feedId ?? 0);
    const bId = Number(b.feedId ?? 0);
    return bId - aId;
  });
  return filtered[0] ?? null;
}

function collectImageUrls(item: FeedItem): string[] {
  const urls = new Set<string>();
  if (item.thumbnail?.url) urls.add(item.thumbnail.url);
  if (Array.isArray(item.media)) {
    for (const m of item.media) {
      if (m?.thumbnail) urls.add(m.thumbnail);
    }
  }
  return Array.from(urls);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || "";
    const suffix = searchParams.get("suffix") || "feed";
    const cookie = searchParams.get("cookie") || undefined;
    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId" },
        { status: 400 }
      );
    }

    const targetUrl = `https://pcmap.place.naver.com/restaurant/${encodeURIComponent(
      businessId
    )}/${encodeURIComponent(suffix)}`;

    const resp = await fetch(targetUrl, {
      method: "GET",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "upgrade-insecure-requests": "1",
        "user-agent": UA,
        referer: "https://pcmap.place.naver.com/",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
    });

    const html = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${resp.status}`, preview: html.slice(0, 400) },
        { status: resp.status }
      );
    }

    const apollo = extractApolloState(html);
    if (!apollo) {
      return NextResponse.json(
        { error: "APOLLO_STATE not found" },
        { status: 500 }
      );
    }

    const latest = selectLatestFeed(apollo);
    if (!latest) {
      return NextResponse.json(
        { error: "No feed item found" },
        { status: 404 }
      );
    }

    const imageUrls = collectImageUrls(latest);

    const result = {
      businessId,
      feedId: latest.feedId ?? null,
      id: latest.id ?? null,
      createdString: latest.createdString ?? null,
      title: latest.title ?? "",
      desc: latest.desc ?? "",
      imageUrls,
      count: imageUrls.length,
    };

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
