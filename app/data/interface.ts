export type Shop = {
  id: string;
  name: string;
  logoUrl: string;
  points: string;
  contact: string;
  description: string;
  menuLinkUrl: string | null;
  menuList: { name: string; price: string }[] | null;
  availableInLaunch: boolean;
  availableInDinner: boolean;
  floor?: "floor1" | "floor2";
  type: "한식" | "분식" | "뷔페"; // | "중식" | "일식" | "양식" |  "기타";
  naverBusinessId?: string; // 네이버 플레이스 사업장 ID (예: "268601895")
  latestFeed?: LatestFeed; // 최신 피드 스냅샷(무DB 환경 캐싱용)
};

export type LatestFeed = {
  createdString: string | null;
  title: string;
  desc: string;
  imageUrls: string[];
  updatedAt: string; // ISO 문자열
};
