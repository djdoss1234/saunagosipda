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

export const regionCoords: Record<string, { lat: number; lng: number }> = {
  seoul: { lat: 37.566, lng: 126.978 },
  gyeonggi: { lat: 37.413, lng: 127.518 },
  incheon: { lat: 37.456, lng: 126.705 },
  busan: { lat: 35.179, lng: 129.075 },
  daegu: { lat: 35.871, lng: 128.601 },
  ulsan: { lat: 35.538, lng: 129.311 },
  gyeongnam: { lat: 35.46, lng: 128.213 },
  gyeongbuk: { lat: 36.491, lng: 128.888 },
  gwangju: { lat: 35.159, lng: 126.852 },
  jeonnam: { lat: 34.816, lng: 126.463 },
  jeonbuk: { lat: 35.82, lng: 127.108 },
  daejeon: { lat: 36.35, lng: 127.384 },
  chungnam: { lat: 36.518, lng: 126.8 },
  chungbuk: { lat: 36.8, lng: 127.7 },
  sejong: { lat: 36.48, lng: 127.289 },
  gangwon: { lat: 37.822, lng: 128.155 },
  jeju: { lat: 33.499, lng: 126.531 },
};
