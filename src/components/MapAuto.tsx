"use client";

import { NaverMap, naverMapEnabled } from "@/components/NaverMap";
import { SaunaMap } from "@/components/SaunaMap";
import { useState } from "react";

/** 네이버 키가 있으면 네이버 지도, 없거나 인증·로드 실패면 OSM 지도로. 화면 쪽은 이 하나만 쓴다. */
export function MapAuto(props: React.ComponentProps<typeof SaunaMap>) {
  const [failed, setFailed] = useState(false);
  if (naverMapEnabled && !failed) return <NaverMap {...props} onFail={() => setFailed(true)} />;
  return <SaunaMap {...props} />;
}
