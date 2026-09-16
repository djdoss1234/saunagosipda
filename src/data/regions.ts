import type { Region } from "@/lib/types";

export const regions: Region[] = [
  { id: "seoul", name: "서울", group: "수도권" },
  { id: "gyeonggi", name: "경기", group: "수도권" },
  { id: "incheon", name: "인천", group: "수도권" },
  { id: "busan", name: "부산", group: "영남" },
  { id: "daegu", name: "대구", group: "영남" },
  { id: "ulsan", name: "울산", group: "영남" },
  { id: "gyeongnam", name: "경남", group: "영남" },
  { id: "gyeongbuk", name: "경북", group: "영남" },
  { id: "gwangju", name: "광주", group: "호남" },
  { id: "jeonnam", name: "전남", group: "호남" },
  { id: "jeonbuk", name: "전북", group: "호남" },
  { id: "daejeon", name: "대전", group: "충청" },
  { id: "chungnam", name: "충남", group: "충청" },
  { id: "chungbuk", name: "충북", group: "충청" },
  { id: "sejong", name: "세종", group: "충청" },
  { id: "gangwon", name: "강원", group: "관동" },
  { id: "jeju", name: "제주", group: "제주" },
];

export const regionGroups = ["수도권", "영남", "호남", "충청", "관동", "제주"];
