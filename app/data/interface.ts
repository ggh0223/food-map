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
};
