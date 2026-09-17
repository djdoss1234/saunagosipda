#!/usr/bin/env python3
"""행정안전부 LOCALDATA 목욕장업 CSV → 영업중만 JSON.

출처: file.localdata.go.kr (공공데이터포털 전국목욕업소표준데이터와 동일 원천)
좌표: EPSG:5174 Bessel TM → WGS84. 온도·요금·영업시간은 인허가에 없어서 넣지 않음.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORGS = json.loads((pathlib.Path(__file__).parent / "localdata-orgcodes.json").read_text(encoding="utf-8"))
OUT = ROOT / "src/data/licensed-baths.json"
CACHE = pathlib.Path(__file__).parent / ".cache" / "public_baths"
GAP_CACHE = pathlib.Path(__file__).parent / ".cache" / "gap"
BASE = "https://file.localdata.go.kr"
# orgCode 없는 전국 CSV. /file/public_baths/info 는 HTML이고, download 경로가 본문이다.
NATIONWIDE = f"{BASE}/file/download/public_baths/info"
OPENAPI = "https://apis.data.go.kr/1741000/public_baths/info"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
REFERER = f"{BASE}/file/general_restaurants/info"
# 시군구 orgCode가 400인 곳의 시도 전체 CSV. 광주·전남 629/646_ALL은 400이지만 전국 파일이 그 구멍을 메운다.
CITY_ALL = (
    ("인천광역시전체", "6280000_ALL"),
    ("광주광역시전체", "6290000_ALL"),
    ("전라남도전체", "6460000_ALL"),
)
# LOCALDATA가 400인 광주·전남·인천 구멍용 공공데이터포털 파일 번호
GAP_DATASETS = (
    "15039939",  # 인천 서구 목욕장업
    "15066151",  # 인천 중·영종 공중위생
    "15007014",  # 인천 제물포구(구 중·동) 공중위생
    "15037396",  # 함평 공중목욕장
    "15006928",  # 함평 공중위생
    "15006991",  # 영광 공중위생
    "15090132",  # 고흥 목욕장업
    "3079575",  # 광양 공중위생
    "15006819",  # 광주 북구 공중위생
    "15011782",  # 광주 서구 공중위생업소
    "15006995",  # 신안 공중위생
    "15006768",  # 해남 공중위생
    "3074190",  # 여수 공중위생
    "15007218",  # 강진 공중위생
    "15011985",  # 장성 공중위생
    "15006840",  # 구례 공중위생
    "3041840",  # 광주 착한가격업소 (목욕업 일부, 동·남·광산 포함)
    "15159948",  # 나주 착한가격업소
    "15054265",  # 영암 목욕탕업소
)

SIDO = (
    ("서울특별시", "seoul"),
    ("부산광역시", "busan"),
    ("대구광역시", "daegu"),
    ("인천광역시", "incheon"),
    ("광주광역시", "gwangju"),
    ("대전광역시", "daejeon"),
    ("울산광역시", "ulsan"),
    ("세종특별자치시", "sejong"),
    ("경기도", "gyeonggi"),
    ("강원특별자치도", "gangwon"),
    ("강원도", "gangwon"),
    ("충청북도", "chungbuk"),
    ("충청남도", "chungnam"),
    ("전북특별자치도", "jeonbuk"),
    ("전라북도", "jeonbuk"),
    ("전라남도", "jeonnam"),
    ("경상북도", "gyeongbuk"),
    ("경상남도", "gyeongnam"),
    ("제주특별자치도", "jeju"),
    ("제주도", "jeju"),
    ("전남광주통합특별시", "gwangju"),
)


def tm5174_to_wgs84(x: float, y: float) -> tuple[float, float] | None:
    a, f = 6377397.155, 1 / 299.1528128
    e2 = f * (2 - f)
    lat0 = math.radians(38)
    lon0 = math.radians(127.0028902777778)
    k0 = 1.0
    x -= 200000.0
    y -= 500000.0
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))

    def meridional(phi: float) -> float:
        e4, e6 = e2 * e2, e2 * e2 * e2
        return a * (
            (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
            - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * math.sin(2 * phi)
            + (15 * e4 / 256 + 45 * e6 / 1024) * math.sin(4 * phi)
            - (35 * e6 / 3072) * math.sin(6 * phi)
        )

    M = y / k0 + meridional(lat0)
    mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2**3 / 256))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    ep2 = e2 / (1 - e2)
    sinp, cosp = math.sin(phi1), math.cos(phi1)
    N1 = a / math.sqrt(1 - e2 * sinp * sinp)
    T1 = math.tan(phi1) ** 2
    C1 = ep2 * cosp * cosp
    R1 = a * (1 - e2) / (1 - e2 * sinp * sinp) ** 1.5
    D = x / (N1 * k0)
    lat = phi1 - (N1 * math.tan(phi1) / R1) * (
        D * D / 2
        - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D**4 / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D**6 / 720
    )
    lon = lon0 + (
        D
        - (1 + 2 * T1 + C1) * D**3 / 6
        + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D**5 / 120
    ) / cosp
    # Bessel geodetic → ECEF → Helmert → WGS84 geodetic
    h = 0.0
    n = a / math.sqrt(1 - e2 * math.sin(lat) ** 2)
    X = (n + h) * math.cos(lat) * math.cos(lon)
    Y = (n + h) * math.cos(lat) * math.sin(lon)
    Z = (n * (1 - e2) + h) * math.sin(lat)
    dx, dy, dz = -115.80, 474.99, 674.11
    rx, ry, rz = math.radians(1.16 / 3600), math.radians(-2.32 / 3600), math.radians(-1.63 / 3600)
    s = 6.43e-6
    X2 = dx + (1 + s) * X + rz * Y - ry * Z
    Y2 = dy - rz * X + (1 + s) * Y + rx * Z
    Z2 = dz + ry * X - rx * Y + (1 + s) * Z
    a_w, f_w = 6378137.0, 1 / 298.257223563
    e2w = f_w * (2 - f_w)
    p = math.hypot(X2, Y2)
    lon_w = math.atan2(Y2, X2)
    lat_w = math.atan2(Z2, p * (1 - e2w))
    for _ in range(8):
        n_w = a_w / math.sqrt(1 - e2w * math.sin(lat_w) ** 2)
        lat_w = math.atan2(Z2 + e2w * n_w * math.sin(lat_w), p)
    wlat, wlon = math.degrees(lat_w), math.degrees(lon_w)
    if not (33.0 <= wlat <= 38.9 and 124.5 <= wlon <= 132.2):
        return None
    return round(wlat, 6), round(wlon, 6)


def decode_csv(raw: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "cp949"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def fetch(org: str, code: str) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / f"{code}.csv"
    if cache.exists() and time.time() - cache.stat().st_mtime < 24 * 3600:
        return cache.read_text(encoding="utf-8")
    url = f"{BASE}/file/download/public_baths/info?{urllib.parse.urlencode({'orgCode': code})}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": REFERER})
    last = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=90) as res:
                if getattr(res, "status", 200) != 200:
                    raise RuntimeError(res.status)
                text = decode_csv(res.read())
            cache.write_text(text, encoding="utf-8")
            return text
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, RuntimeError) as err:
            last = err
            if isinstance(err, urllib.error.HTTPError) and err.code in (400, 403, 404):
                break
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"{org} {code}: {last}")


def fetch_nationwide() -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / "NATIONWIDE.csv"
    if cache.exists() and cache.stat().st_size > 1000 and time.time() - cache.stat().st_mtime < 24 * 3600:
        return decode_csv(cache.read_bytes())
    req = urllib.request.Request(NATIONWIDE, headers={"User-Agent": UA, "Referer": REFERER})
    with urllib.request.urlopen(req, timeout=120) as res:
        if getattr(res, "status", 200) != 200:
            raise RuntimeError(res.status)
        raw = res.read()
    text = decode_csv(raw)
    if "사업장명" not in text.splitlines()[0]:
        raise RuntimeError("nationwide csv missing 사업장명")
    cache.write_bytes(raw)
    return text


def merge_nationwide(items: dict[str, dict], fails: list[str]) -> bool:
    try:
        text = fetch_nationwide()
        fp_to_id = {fingerprint(r["name"], r["address"]): rid for rid, r in items.items()}
        n = 0
        for row in rows_from_csv(text):
            fp = fingerprint(row["name"], row["address"])
            old = fp_to_id.get(fp)
            if old and old != row["id"] and old in items:
                del items[old]
            items[row["id"]] = row
            fp_to_id[fp] = row["id"]
            n += 1
        print(f"nationwide: {n} rows", flush=True)
        return n >= 1000
    except Exception as err:  # noqa: BLE001
        fails.append(f"nationwide: {err}")
        print(f"nationwide: FAIL {err}", flush=True)
        return False


JEONNAM_DISTRICTS = {
    "목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군",
    "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군",
    "함평군", "영광군", "장성군", "완도군", "진도군", "신안군",
}


def region_of(address: str) -> tuple[str, str] | None:
    addr = address.strip()
    for prefix, rid in SIDO:
        if addr.startswith(prefix):
            rest = addr[len(prefix) :].strip()
            district = rest.split()[0] if rest else prefix
            if rid == "sejong":
                district = "세종"
            if prefix.startswith("전남광주") and district in JEONNAM_DISTRICTS:
                rid = "jeonnam"
            return rid, district
    # 시·군만 적힌 지자체 CSV
    for district in JEONNAM_DISTRICTS:
        if addr.startswith(district):
            return "jeonnam", district
    short = re.match(r"^광주\s+(\S+)", addr)
    if short:
        return "gwangju", short.group(1)
    if addr.startswith("광산구"):
        return "gwangju", "광산구"
    return None


def facility_type(kind: str, name: str) -> str:
    blob = f"{kind}{name}"
    if "온천" in blob:
        return "온천"
    if "찜질" in blob or "스파랜드" in name or "불한증" in blob:
        return "찜질방"
    if "호텔" in name or "리조트" in name:
        return "호텔스파"
    return "사우나"


def num(v: str) -> float | None:
    s = (v or "").strip().replace(",", "")
    if not s:
        return None
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n != 0 else None


def place_from_csv_row(row: dict[str, str]) -> dict | None:
    detail = (row.get("상세영업상태명") or "").strip()
    status = (row.get("영업상태명") or "").strip()
    if detail == "폐업" or status.startswith("폐업") or "휴업" in status or "휴업" in detail:
        return None
    if detail != "영업" and not status.startswith("영업"):
        return None
    name = (row.get("사업장명") or "").strip()
    if not name:
        return None
    addr = (row.get("도로명주소") or "").strip() or (row.get("지번주소") or "").strip()
    if not addr:
        return None
    loc = region_of(addr)
    if not loc:
        return None
    region_id, district = loc
    x, y = num(row.get("좌표정보(X)") or ""), num(row.get("좌표정보(Y)") or "")
    ll = tm5174_to_wgs84(x, y) if x is not None and y is not None else None
    mgt = (row.get("관리번호") or "").strip()
    kind = (row.get("업태구분명") or row.get("위생업태명") or "").strip()
    phone = re.sub(r"[^0-9+]", "", row.get("전화번호") or "")
    return {
        "id": "ld-" + re.sub(r"[^0-9A-Za-z]+", "-", mgt).strip("-"),
        "name": name,
        "kind": kind,
        "type": facility_type(kind, name),
        "regionId": region_id,
        "district": district,
        "address": addr,
        "lat": ll[0] if ll else None,
        "lng": ll[1] if ll else None,
        "phone": phone,
    }


def rows_from_csv(text: str) -> list[dict]:
    sample = text[:4096]
    if "사업장명" not in sample:
        return []
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        place = place_from_csv_row(row)
        if place:
            out.append(place)
    return out


def _item_get(item: dict, *keys: str) -> str:
    lower = {str(k).lower(): v for k, v in item.items()}
    for key in keys:
        val = item.get(key)
        if val is None:
            val = lower.get(key.lower())
        if val is not None and str(val).strip() not in ("", "None"):
            return str(val).strip()
    return ""


def openapi_item_to_csv_row(item: dict) -> dict[str, str]:
    return {
        "사업장명": _item_get(item, "bplcNm", "BPLC_NM", "사업장명"),
        "도로명주소": _item_get(item, "rdnWhlAddr", "RDN_WHL_ADDR", "도로명주소"),
        "지번주소": _item_get(item, "siteWhlAddr", "SITE_WHL_ADDR", "지번주소"),
        "전화번호": _item_get(item, "siteTel", "SITE_TEL", "전화번호"),
        "좌표정보(X)": _item_get(item, "x", "X", "좌표정보(X)"),
        "좌표정보(Y)": _item_get(item, "y", "Y", "좌표정보(Y)"),
        "관리번호": _item_get(item, "mgtNo", "MGT_NO", "관리번호"),
        "영업상태명": _item_get(item, "trdStateNm", "TRD_STATE_NM", "영업상태명"),
        "상세영업상태명": _item_get(item, "dtlStateNm", "DTL_STATE_NM", "상세영업상태명"),
        "업태구분명": _item_get(item, "uptaeNm", "UPTAE_NM", "업태구분명"),
    }


def _unwrap_openapi_items(payload: object) -> tuple[list[dict], int]:
    data = payload
    if isinstance(data, dict) and "response" in data:
        data = data["response"]
    body = data.get("body", data) if isinstance(data, dict) else {}
    if not isinstance(body, dict):
        return [], 0
    items = body.get("items") or body.get("item") or []
    if isinstance(items, dict):
        items = items.get("item") or items.get("items") or []
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        items = []
    total = body.get("totalCount") or body.get("totalcount") or len(items)
    try:
        total_n = int(total)
    except (TypeError, ValueError):
        total_n = len(items)
    return [x for x in items if isinstance(x, dict)], total_n


def fetch_openapi_page(key: str, page: int, rows: int = 1000) -> tuple[list[dict], int]:
    qs = urllib.parse.urlencode({"pageNo": page, "numOfRows": rows, "type": "json"})
    url = f"{OPENAPI}?{qs}&serviceKey={key}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as res:
        raw = res.read()
    text = raw.decode("utf-8", "replace")
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"openapi json: {err}") from err
    header = payload.get("response", payload).get("header", {}) if isinstance(payload, dict) else {}
    code = str(header.get("resultCode") or header.get("returnAuthMsg") or "")
    if code and code not in ("00", "0", "NORMAL_CODE"):
        raise RuntimeError(f"openapi {code} {header.get('resultMsg') or header.get('errMsg') or ''}".strip())
    if "OpenAPI_ServiceResponse" in payload:
        msg = payload["OpenAPI_ServiceResponse"].get("cmmMsgHeader", {})
        raise RuntimeError(str(msg.get("returnAuthMsg") or msg.get("errMsg") or "openapi denied"))
    return _unwrap_openapi_items(payload)


def pick(row: dict[str, str], *names: str) -> str:
    compact = {re.sub(r"\s+", "", k): v for k, v in row.items()}
    for name in names:
        val = (compact.get(re.sub(r"\s+", "", name)) or "").strip()
        if val:
            return val
    for key, val in compact.items():
        if any(re.sub(r"\s+", "", name) in key for name in names) and (val or "").strip():
            return val.strip()
    return ""


def municipal_is_bath(kind: str, name: str) -> bool:
    k = kind.replace(" ", "")
    if "목욕" in k or "공동탕" in k or "한증" in k:
        return True
    if any(x in k for x in ("숙박", "이용", "미용", "세탁", "건물위생", "위생관리", "식품")):
        return False
    n = name.replace(" ", "")
    return bool(re.search(r"사우나|찜질|목욕|온천|한증|공동탕|대중탕", n))


def fingerprint(name: str, addr: str) -> str:
    n = re.sub(r"\s+", "", name)
    a = re.sub(r"\s+", "", addr)
    a = re.sub(r"인천광역시|전라남도|전남광주통합특별시|광주광역시", "", a)
    a = re.sub(r"^광주", "", a)
    a = re.split(r"[,(\uff08（]", a, maxsplit=1)[0]
    a = re.sub(r"제물포구|영종구", "중구", a)
    a = re.sub(r"서해구|검단구", "서구", a)
    return f"{n}|{a}"


def has_coords(row: dict) -> bool:
    return row.get("lat") is not None and row.get("lng") is not None


def prefer_place(a: dict, b: dict) -> bool:
    if has_coords(a) != has_coords(b):
        return has_coords(a)
    a_ld, b_ld = str(a.get("id", "")).startswith("ld-"), str(b.get("id", "")).startswith("ld-")
    return a_ld and not b_ld


def compact_by_fingerprint(items: dict[str, dict]) -> None:
    best: dict[str, str] = {}
    for rid, row in list(items.items()):
        fp = fingerprint(row["name"], row["address"])
        old = best.get(fp)
        if old is None:
            best[fp] = rid
            continue
        if prefer_place(row, items[old]):
            del items[old]
            best[fp] = rid
        elif rid in items:
            del items[rid]


def fetch_gap_csv(pk: str) -> str:
    GAP_CACHE.mkdir(parents=True, exist_ok=True)
    dest = GAP_CACHE / f"{pk}.csv"
    if dest.exists() and dest.stat().st_size > 80:
        return decode_csv(dest.read_bytes())
    page = urllib.request.Request(
        f"https://www.data.go.kr/data/{pk}/fileData.do", headers={"User-Agent": UA}
    )
    with urllib.request.urlopen(page, timeout=60) as res:
        html = res.read().decode("utf-8", "replace")
    files = re.findall(r"FILE_\d+", html)
    if not files:
        raise RuntimeError(f"{pk}: FILE id 없음")
    url = f"https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId={files[0]}&fileDetailSn=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as res:
        raw = res.read()
    dest.write_bytes(raw)
    return decode_csv(raw)


def rows_from_municipal(text: str) -> list[dict]:
    sample = text[:2048]
    if not any(k in sample for k in ("업소명", "사업장명", "명칭", "상호명", "상호", "업체명")):
        return []
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        name = pick(row, "업소명", "사업장명", "명칭", "상호명", "상호", "업체명")
        kind = pick(row, "업종명", "업종", "업태구분명", "업태명")
        if not name or not municipal_is_bath(kind, name):
            continue
        addr = pick(
            row,
            "영업소 주소(도로명)",
            "영업소주소(도로명)",
            "업소 소재지",
            "소재지전체주소",
            "소재지",
            "도로명주소",
            "주소",
        )
        if not addr:
            continue
        loc = region_of(addr)
        if not loc:
            continue
        region_id, district = loc
        phone = re.sub(r"[^0-9+]", "", pick(row, "소재지전화", "소재지 전화", "전화번호", "연락처", "전화"))
        lat = num(pick(row, "위도", "lat"))
        lng = num(pick(row, "경도", "lng"))
        if lat is None or lng is None or not (33.0 <= lat <= 38.9 and 124.5 <= lng <= 132.2):
            lat = lng = None
        digest = hashlib.sha1(f"{name}|{addr}".encode("utf-8")).hexdigest()[:12]
        out.append(
            {
                "id": "gap-" + digest,
                "name": name,
                "kind": kind or "목욕장업",
                "type": facility_type(kind, name),
                "regionId": region_id,
                "district": district,
                "address": addr,
                "lat": lat,
                "lng": lng,
                "phone": phone,
            }
        )
    return out


def merge_city_all(items: dict[str, dict], fails: list[str]) -> None:
    fp_to_id = {fingerprint(r["name"], r["address"]): rid for rid, r in items.items()}
    for name, code in CITY_ALL:
        try:
            text = fetch(name, code)
            n = 0
            for row in rows_from_csv(text):
                fp = fingerprint(row["name"], row["address"])
                old = fp_to_id.get(fp)
                if old and old != row["id"] and old in items:
                    del items[old]
                items[row["id"]] = row
                fp_to_id[fp] = row["id"]
                n += 1
            print(f"city {code}: {n} rows", flush=True)
        except Exception as err:  # noqa: BLE001
            fails.append(f"city-{code}: {err}")
            print(f"city {code}: FAIL {err}", flush=True)


def merge_openapi(items: dict[str, dict], fails: list[str]) -> None:
    key = (os.environ.get("DATA_GO_KR_KEY") or "").strip()
    if not key:
        print("openapi: skip (DATA_GO_KR_KEY 없음)", flush=True)
        return
    fp_to_id = {fingerprint(r["name"], r["address"]): rid for rid, r in items.items()}
    page, added = 1, 0
    total = None
    while True:
        try:
            batch, total = fetch_openapi_page(key, page)
        except Exception as err:  # noqa: BLE001
            fails.append(f"openapi-p{page}: {err}")
            print(f"openapi page {page}: FAIL {err}", flush=True)
            break
        if not batch:
            break
        for item in batch:
            place = place_from_csv_row(openapi_item_to_csv_row(item))
            if not place:
                continue
            fp = fingerprint(place["name"], place["address"])
            old = fp_to_id.get(fp)
            if old and old != place["id"] and old in items:
                del items[old]
            items[place["id"]] = place
            fp_to_id[fp] = place["id"]
            added += 1
        print(f"openapi page {page}: {len(batch)} rows, merged {added}", flush=True)
        if total is not None and page * 1000 >= total:
            break
        if len(batch) < 1000:
            break
        page += 1
        time.sleep(0.2)
    print(f"openapi: +{added} merged, totalCount={total}", flush=True)


def self_check() -> None:
    sample = openapi_item_to_csv_row(
        {
            "bplcNm": "동구테스트탕",
            "rdnWhlAddr": "광주광역시 동구 금남로 1",
            "trdStateNm": "영업/정상",
            "dtlStateNm": "영업",
            "mgtNo": "3590000-202-1990-00001",
        }
    )
    place = place_from_csv_row(sample)
    assert place is not None and place["regionId"] == "gwangju" and place["district"] == "동구"
    assert place["id"].startswith("ld-")
    closed = place_from_csv_row({**sample, "상세영업상태명": "폐업", "영업상태명": "폐업"})
    assert closed is None
    jeonnam = place_from_csv_row(
        {
            **sample,
            "사업장명": "목포테스트탕",
            "도로명주소": "전남광주통합특별시 목포시 영산로 1",
            "관리번호": "4800000-202-1990-00001",
        }
    )
    assert jeonnam is not None and jeonnam["regionId"] == "jeonnam" and jeonnam["district"] == "목포시"
    short = rows_from_municipal(
        "업종명,업소명,주소\n목욕업,동구테스트탕,광주 동구 금남로 1\n"
    )
    assert short and short[0]["regionId"] == "gwangju" and short[0]["district"] == "동구"
    assert fingerprint("일곡녹차사우나", "광주 북구 일곡마을로 10-1, 상가동 120호") == fingerprint(
        "일곡녹차사우나", "전남광주통합특별시 북구 일곡마을로 10-1 (일곡동)"
    )
    assert municipal_is_bath("", "하남민속대중탕")
    sangho = rows_from_municipal("상호,주소\n정우사우나,광주 남구 금화로422번길 41\n")
    assert sangho and sangho[0]["name"] == "정우사우나" and sangho[0]["district"] == "남구"


def merge_gap_places(items: dict[str, dict], fails: list[str]) -> None:
    seen = {fingerprint(r["name"], r["address"]) for r in items.values()}
    for pk in GAP_DATASETS:
        try:
            text = fetch_gap_csv(pk)
            added = 0
            for row in rows_from_municipal(text):
                fp = fingerprint(row["name"], row["address"])
                if fp in seen:
                    continue
                seen.add(fp)
                items[row["id"]] = row
                added += 1
            print(f"gap {pk}: +{added}", flush=True)
        except Exception as err:  # noqa: BLE001
            fails.append(f"gap-{pk}: {err}")
            print(f"gap {pk}: FAIL {err}", flush=True)


def main() -> int:
    self_check()
    CACHE.mkdir(parents=True, exist_ok=True)
    items: dict[str, dict] = {}
    fails: list[str] = []
    gaps_only = "--gaps" in sys.argv
    if gaps_only and OUT.exists():
        payload = json.loads(OUT.read_text(encoding="utf-8"))
        for row in payload.get("places") or []:
            items[row["id"]] = row
        print(f"loaded {len(items)} existing places, merging nationwide + city-all + municipal gaps + openapi", flush=True)
        merge_nationwide(items, fails)
        merge_city_all(items, fails)
        merge_gap_places(items, fails)
        merge_openapi(items, fails)
        compact_by_fingerprint(items)
        rows = sorted(items.values(), key=lambda r: (r["regionId"], r["district"], r["name"], r["id"]))
        with_coord = sum(1 for r in rows if r["lat"] is not None)
        sources = payload.get("source") or ""
        if "전국" not in sources:
            sources += " + LOCALDATA 전국 CSV"
        if "지자체" not in sources:
            sources += " + 공공데이터포털 지자체 공중위생·목욕장 CSV"
        if "시도전체" not in sources:
            sources += " + LOCALDATA 시도전체"
        out = {
            "source": sources,
            "note": payload.get("note") or "영업중만. 온도·요금·영업시간은 원천에 없음.",
            "count": len(rows),
            "withCoord": with_coord,
            "failedOrgs": fails,
            "places": rows,
        }
        OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"wrote {OUT} {len(rows)} open, {with_coord} with coords, fails={len(fails)}")
        return 0

    if not merge_nationwide(items, fails):
        with ThreadPoolExecutor(max_workers=6) as pool:
            futs = {pool.submit(fetch, name, code): name for name, code in ORGS.items()}
            for i, fut in enumerate(as_completed(futs), 1):
                name = futs[fut]
                try:
                    text = fut.result()
                    for row in rows_from_csv(text):
                        items[row["id"]] = row
                except Exception as err:  # noqa: BLE001 — 한 구 실패가 전체를 죽이지 않음
                    fails.append(f"{name}: {err}")
                if i % 20 == 0:
                    print(f"{i}/{len(ORGS)} 구·시 처리, 영업중 {len(items)}곳", flush=True)
    merge_city_all(items, fails)
    merge_gap_places(items, fails)
    merge_openapi(items, fails)
    compact_by_fingerprint(items)
    rows = sorted(items.values(), key=lambda r: (r["regionId"], r["district"], r["name"], r["id"]))
    with_coord = sum(1 for r in rows if r["lat"] is not None)
    payload = {
        "source": "행정안전부 LOCALDATA 생활_목욕장업 전국 CSV (file.localdata.go.kr/file/download/public_baths/info) + 공공데이터포털 지자체 공중위생·목욕장 CSV",
        "note": "영업상태=영업만. 폐업·휴업 제외. 온도·요금·영업시간은 원천에 없음.",
        "count": len(rows),
        "withCoord": with_coord,
        "failedOrgs": fails,
        "places": rows,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} {len(rows)} open, {with_coord} with coords, fails={len(fails)}")
    if fails:
        print("\n".join(fails[:20]))
    # 좌표 변환 스모크: 종로 청운동 폐업 레코드가 아니라 서울 범위
    sample = next((r for r in rows if r["regionId"] == "seoul" and r["lat"]), None)
    if sample:
        print("seoul sample", sample["name"], sample["lat"], sample["lng"], sample["address"])
        assert 37.4 < sample["lat"] < 37.8 and 126.7 < sample["lng"] < 127.2
    assert len(rows) >= 1000, f"too few: {len(rows)}"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
