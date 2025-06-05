export type Shop = {
  id: string;
  name: string;
  points: string;
  contact: string;
  description: string;
  menuLinkUrl: string | null;
  menuImageUrl: string | null;
  availableInLaunch: boolean;
  availableInDinner: boolean;
  floor?: "floor1" | "floor2";
};
