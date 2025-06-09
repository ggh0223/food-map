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
};
