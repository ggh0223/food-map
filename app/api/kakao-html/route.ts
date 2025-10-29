import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target =
      searchParams.get("url") || "https://pf.kakao.com/_xgUVZn/posts";
    const cookie = searchParams.get("cookie") || undefined;

    const url = new URL(target);
    if (url.hostname !== "pf.kakao.com") {
      return NextResponse.json(
        { error: "Only pf.kakao.com is allowed" },
        { status: 400 }
      );
    }

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "upgrade-insecure-requests": "1",
        "user-agent": UA,
        referer: "https://pf.kakao.com/",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
    });

    const text = await resp.text();

    if (!resp.ok) {
      return new NextResponse(text, {
        status: resp.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
