export type FacilityType =
  | "찜질방"
  | "온천"
  | "호텔스파"
  | "사우나"
  | "워터파크스파";

export type GenderPolicy = "남녀분리" | "남성전용" | "여성전용" | "혼성";

export type RoomGender = "남" | "여" | "공용";

export type SaunaRoom = {
  name: string;
  tempC: number;
  type: string;
  gender: RoomGender;
};

export type Plunge = {
  name: string;
  tempC: number;
  gender: RoomGender;
};

export type OutdoorRest = "없음" | "내기욕만" | "있음" | "우수";
export type LoopQuality = "끊김" | "보통" | "좋음";
export type HumidityStyle = "건식" | "습식가능" | "로우류";
export type PlungeDepth = "얕음" | "어깨" | "깊음";

/** 토토노이 루프(사우나→냉탕→외기욕)를 시설 단위로 비교하기 위한 프로필 */
export type TotonoiProfile = {
  outdoorRest: OutdoorRest;
  loop: LoopQuality;
  humidity: HumidityStyle;
  tvInSauna: boolean;
  restLieDown: boolean;
  natureView: boolean;
  plungeDepth: PlungeDepth;
};

export type Facility = {
  id: string;
  name: string;
  nameEn: string;
  type: FacilityType;
  regionId: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  priceFrom: number;
  hours: string;
  open24h: boolean;
  reservation: boolean;
  genderPolicy: GenderPolicy;
  saunas: SaunaRoom[];
  plunges: Plunge[];
  amenities: string[];
  wantCount: number;
  visitCount: number;
  rating: number;
  tags: string[];
  cover: string;
  gallery: string[];
  description: string;
  crowd: number[];
  featured?: boolean;
  totonoi?: TotonoiProfile;
};

export type Visit = {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  date: string;
  visitNumber: number;
  body: string;
  food?: string;
  saunaTemps: number[];
  plungeTemps: number[];
  likes: number;
  photo: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  cover: string;
  minutes: number;
  body: string[];
};

export type Region = {
  id: string;
  name: string;
  group: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
};
