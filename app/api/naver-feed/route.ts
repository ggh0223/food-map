import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type FeedImage = { url: string };
type FeedItem = { id: string; images?: FeedImage[] };
type PageInfo = { hasNextPage?: boolean; endCursor?: string };

const NAVER_GQL = `
  query placeDetailFeedList($input: PlaceDetailFeedListInput!) {
    placeDetailFeedList(input: $input) {
      items { id images { url } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchNaverFeed(businessId: string, cursor?: string) {
  const variables = cursor
    ? { input: { businessId, cursor } }
    : { input: { businessId } };

  const resp = await fetch("https://pcmap-api.place.naver.com/graphql", {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
      origin: "https://pcmap.place.naver.com",
      referer: "https://pcmap.place.naver.com/",
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      operationName: "placeDetailFeedList",
      query: NAVER_GQL,
      variables,
    }),
    next: { revalidate },
  });

  if (!resp.ok) {
    throw new Error(`Naver GraphQL error: ${resp.status}`);
  }

  const json = await resp.json();
  if (json.errors) {
    throw new Error(`GraphQL responded with errors: ${JSON.stringify(json.errors)}`);
  }

  const data = json?.data?.placeDetailFeedList;
  const items: FeedItem[] = data?.items ?? [];
  const pageInfo: PageInfo = data?.pageInfo ?? {};

  const imageUrls = items
    .flatMap((it) => (it.images ?? []).map((im) => im.url))
    .filter(Boolean);

  return {
    imageUrls,
    hasNextPage: !!pageInfo?.hasNextPage,
    nextCursor: pageInfo?.endCursor ?? null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || "";
    const cursor = searchParams.get("cursor") || undefined;
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const { imageUrls, hasNextPage, nextCursor } = await fetchNaverFeed(businessId, cursor);
    const unique = Array.from(new Set(imageUrls));

    return NextResponse.json({
      businessId,
      count: unique.length,
      imageUrls: unique,
      pageInfo: { hasNextPage, nextCursor },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message ?? "Unknown error" }, { status: 500 });
  }
}


