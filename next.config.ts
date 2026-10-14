import path from "path";
import type { NextConfig } from "next";

// 스톡 사진을 쓰지 않으므로 원격 이미지 허용 목록이 없다.
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
