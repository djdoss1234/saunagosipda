export type PlaceType = "찜질방" | "온천" | "호텔스파" | "사우나" | "워터파크스파";
/** 인허가 임포트(lib/localdata)가 쓰는 이름. */
export type FacilityType = PlaceType;

/** 시설은 부가 정보다. 인허가에 있는 것만 담는다. 온도·요금·영업시간은 지어내지 않는다. */
export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  regionId: string;
  district: string;
  address: string;
  /** 인허가 원천에 있을 때만. 시드 데모 번호는 넣지 않는다. */
  phone?: string;
};

export type Region = {
  id: string;
  name: string;
  group: string;
};

export type UserProfile = {
  id: string;
  name: string;
};

/** 한 세트 = 사우나 → 냉탕 → 외기욕. 단위는 모두 초(타이머 정밀도 그대로). */
export type SaunaSet = {
  saunaSec: number;
  plungeSec: number;
  restSec: number;
};

export type Totonoi = 1 | 2 | 3 | 4 | 5;

export type RecordSource = "manual" | "locker" | "timer" | "watch" | "legacy";

export type SessionRecord = {
  id: string;
  userId: string;
  userName: string;
  placeId?: string;
  placeName: string;
  /** YYYY-MM-DD (현지 날짜) */
  date: string;
  createdAt: string;
  sets: SaunaSet[];
  totonoi: Totonoi;
  saunaTempC?: number;
  plungeTempC?: number;
  memo?: string;
  food?: string;
  public: boolean;
  /**
   * 어떻게 잰 기록인가.
   * manual = 나와서 기억으로 · locker = 입장~퇴장(머문 시간)만 측정 · timer = 단계별 측정 · watch = 워치 · legacy = 예전 앱
   * 세트당 시간이 실측인 건 timer·watch뿐. 나머지는 루틴으로 채운 추정값이다.
   */
  source: RecordSource;
  /** 입장~퇴장 분(사물함 타이머로 잰 값). 샤워·탕·세신 포함이라 사우나 시간이 아니다. */
  stayMin?: number;
  /** 입장 시각 ISO. 아침/밤 구분용. */
  startedAt?: string;
  likes: number;
  /** 로컬 전용: 공개 기록이 서버에 올라갔는지 */
  synced?: boolean;
};
