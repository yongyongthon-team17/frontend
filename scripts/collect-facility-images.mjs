#!/usr/bin/env node
/**
 * 용인시 공공 여가시설 실제 사진 후보 수집 · 적용 스크립트 (API 키 불필요).
 *
 *   node scripts/collect-facility-images.mjs collect   # 시설 목록 + 사진 후보 수집 → docs/facility-images/candidates.json
 *   node scripts/collect-facility-images.mjs apply     # 승인 후보만 다운로드 → public/images/facilities, src/data/facilityImages.ts
 *
 * 시설 목록: 백엔드 A02를 7요일 × 여러 시간대로 조회해 facilityId로 중복 제거하고,
 *           A02에 한 번도 나오지 않은 id 구간은 A03으로 확인한다(운영시간 미상·휴관 시설).
 * 사진 출처: Wikimedia Commons(파일 검색 · 좌표 주변 검색), Wikidata(P18 대표 이미지).
 *           라이선스가 메타데이터에 명시된 파일만 다룬다. 네이버·카카오 지도 등은 사용하지 않는다.
 *
 * 자동 승인 조건(모두 충족):
 *   1) 이름: 파일 제목·설명·분류 중 하나에 정규화한 시설명 전체가 들어 있다
 *   2) 위치: 파일 좌표가 시설 좌표 300m 이내이거나, Wikidata 항목 좌표가 500m 이내이거나,
 *            설명·분류에 "용인"과 시설 주소의 구 이름이 함께 들어 있다
 *   3) 권한: CC0 / Public domain / CC BY / CC BY-SA / 공공누리 제1유형
 *   4) 제외: 제목에 "인근·근처·주변·앞 ·부근"이 있으면(시설이 아닌 주변 사진일 수 있음) 검토로 보낸다
 * 자동 승인 후보도 docs/facility-images/review-decisions.json에서 사람이 거절할 수 있고,
 * 검토 후보는 사람이 승인해도 권한 조건(3)을 만족하지 않으면 적용하지 않는다.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DOCS_DIR = path.join(ROOT, "docs/facility-images")
const CANDIDATES_FILE = path.join(DOCS_DIR, "candidates.json")
/** 중간 결과(시설 목록·시설별 검색 결과·파일 메타데이터). 중단돼도 여기서 이어서 한다 */
const FACILITIES_FILE = path.join(DOCS_DIR, "facilities.json")
const SEARCH_CACHE_FILE = path.join(DOCS_DIR, "search-cache.json")
const DECISIONS_FILE = path.join(DOCS_DIR, "review-decisions.json")
const SOURCES_FILE = path.join(DOCS_DIR, "sources.json")
const IMAGE_DIR = path.join(ROOT, "public/images/facilities")
const MAP_FILE = path.join(ROOT, "src/data/facilityImages.ts")

const API_BASE = (process.env.FACILITY_API_BASE || "https://api.jigeumgayong.site").replace(/\/+$/, "")
const COMMONS_API = "https://commons.wikimedia.org/w/api.php"
const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const USER_AGENT = "facility-image-collector/1.0 (public facility search demo)"
/** Wikimedia 요청 간격. 429를 받으면 늘리고(최대 MAX_GAP_MS) 계속 그 간격을 유지한다 */
let requestGapMs = Number(process.env.REQUEST_GAP_MS) || 2500
const MAX_GAP_MS = 15_000
const MAX_RETRY_AFTER_S = 180
const REQUEST_TIMEOUT_MS = 20_000
const IMAGE_WIDTH = 1200

const ALLOWED_LICENSE =
  /^(cc0|cc[- ]?zero|public domain|pd\b|pd-|cc[- ]by(-sa)?[- ][\d.]+|cc[- ]by(-sa)?$|kogl type 1|공공누리 제1유형)/i
const NEAR_WORDS = /(인근|근처|주변|부근|앞\s|앞에서)/

// ── 공통 ───────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let lastRequestAt = 0

async function getJson(url, { throttle = true, retries = 8 } = {}) {
  for (let attempt = 0; ; attempt++) {
    if (throttle) {
      const wait = lastRequestAt + requestGapMs - Date.now()
      if (wait > 0) await sleep(wait)
      lastRequestAt = Date.now()
    }
    let response
    try {
      response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      if (attempt >= retries) throw error
      console.warn(`  요청 실패(${error.name}), ${5 * (attempt + 1)}초 뒤 재시도`)
      await sleep(5000 * (attempt + 1))
      continue
    }
    if (response.status === 429 || response.status >= 500) {
      if (attempt >= retries) throw new Error(`HTTP ${response.status} ${url}`)
      const retryAfter = Math.min(
        Number(response.headers.get("retry-after")) || 10 * (attempt + 1),
        MAX_RETRY_AFTER_S,
      )
      if (response.status === 429) requestGapMs = Math.min(requestGapMs * 1.5, MAX_GAP_MS)
      console.warn(`  HTTP ${response.status}: ${retryAfter}초 대기 후 재시도 (요청 간격 ${Math.round(requestGapMs)}ms)`)
      await sleep(retryAfter * 1000)
      continue
    }
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
    return response.json()
  }
}

const query = (base, params) => `${base}?${new URLSearchParams({ format: "json", ...params })}`

/** 공백·괄호 주석("(휴관중)")·특수문자를 지운 비교용 이름 */
export function normalizeName(name) {
  return String(name)
    .replace(/\([^)]*\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\s·.,_\-–'"“”‘’]/g, "")
    .toLowerCase()
}

const stripHtml = (text) => String(text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

function distanceMeters(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null
  const rad = (deg) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(h)))
}

// ── 1. 시설 목록 ───────────────────────────────────────

const SLOTS = [
  ["00:00", "01:00"], ["06:00", "07:00"], ["09:00", "10:00"], ["12:00", "13:00"],
  ["15:00", "16:00"], ["18:00", "19:00"], ["21:00", "22:00"], ["23:00", "23:59"],
]

const pickFacility = (item, source) => ({
  facilityId: item.facilityId,
  name: item.name,
  address: item.address,
  typeName: item.typeName,
  district: item.district,
  imageUrl: item.imageUrl,
  coordinates: item.coordinates
    ? { lat: Number(item.coordinates.latitude), lon: Number(item.coordinates.longitude) }
    : null,
  listedBy: source,
})

async function fetchFacilities() {
  const facilities = new Map()
  for (let day = 0; day < 7; day++) {
    for (const [startTime, endTime] of SLOTS) {
      const data = await getJson(
        `${API_BASE}/api/v1/facilities?${new URLSearchParams({ dayOfWeek: day, startTime, endTime })}`,
        { throttle: false },
      )
      for (const item of data?.data?.items ?? []) {
        if (!facilities.has(item.facilityId)) facilities.set(item.facilityId, pickFacility(item, "A02"))
      }
    }
  }
  const a02Count = facilities.size
  // A02에 안 나온 id를 A03으로 확인한다. 최대 id 뒤로 연속 20개가 404면 끝으로 본다
  const maxId = Math.max(...[...facilities.keys()].map(Number))
  let misses = 0
  for (let id = 1; id <= maxId || misses < 20; id++) {
    if (facilities.has(String(id))) continue
    const data = await getJson(
      `${API_BASE}/api/v1/facilities/${id}?dayOfWeek=0&startTime=10:00&endTime=11:00`,
      { throttle: false },
    )
    if (data?.data?.facility) {
      facilities.set(String(id), pickFacility(data.data.facility, "A03"))
      misses = 0
    } else if (id > maxId) {
      misses++
    }
  }
  console.log(`시설 ${facilities.size}개 (A02 ${a02Count}, A03 보충 ${facilities.size - a02Count})`)
  return [...facilities.values()].sort((a, b) => Number(a.facilityId) - Number(b.facilityId))
}

// ── 2. 후보 검색 ───────────────────────────────────────

async function searchCommonsByName(name) {
  const clean = String(name).replace(/\([^)]*\)/g, "").trim()
  const data = await getJson(
    query(COMMONS_API, { action: "query", list: "search", srnamespace: "6", srlimit: "10", srsearch: `"${clean}"` }),
  )
  return (data?.query?.search ?? []).map((hit) => hit.title)
}

async function searchCommonsNearby(coordinates) {
  if (!coordinates || !Number.isFinite(coordinates.lat)) return []
  const data = await getJson(
    query(COMMONS_API, {
      action: "query", list: "geosearch", gsnamespace: "6", gslimit: "30", gsradius: "300",
      gscoord: `${coordinates.lat}|${coordinates.lon}`,
    }),
  )
  return (data?.query?.geosearch ?? []).map((hit) => hit.title)
}

async function searchWikidata(name) {
  const clean = String(name).replace(/\([^)]*\)/g, "").trim()
  const found = await getJson(
    query(WIKIDATA_API, { action: "wbsearchentities", language: "ko", uselang: "ko", type: "item", limit: "5", search: clean }),
  )
  const ids = (found?.search ?? []).filter((hit) => normalizeName(hit.label) === normalizeName(clean)).map((hit) => hit.id)
  if (!ids.length) return []
  const entities = await getJson(
    query(WIKIDATA_API, { action: "wbgetentities", ids: ids.join("|"), props: "claims|labels", languages: "ko" }),
  )
  const results = []
  for (const entity of Object.values(entities?.entities ?? {})) {
    const image = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    const coord = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value
    if (!image) continue
    results.push({
      title: `File:${image}`,
      wikidataId: entity.id,
      wikidataCoordinates: coord ? { lat: coord.latitude, lon: coord.longitude } : null,
    })
  }
  return results
}

/**
 * Commons 파일 메타데이터(라이선스·작성자·좌표·분류·썸네일 URL)를 10개씩 묶어 가져온다.
 * coordinates는 colimit 기본값이 10이라 max로 올리지 않으면 뒤쪽 파일의 좌표가 빠진다.
 */
async function fetchFileInfo(titles) {
  const info = new Map()
  for (let i = 0; i < titles.length; i += 10) {
    const chunk = titles.slice(i, i + 10)
    const data = await getJson(
      query(COMMONS_API, {
        action: "query", titles: chunk.join("|"), prop: "imageinfo|coordinates|categories",
        iiprop: "url|extmetadata|size|mime", iiurlwidth: String(IMAGE_WIDTH),
        colimit: "max", coprop: "type|name", coprimary: "all", cllimit: "max", clshow: "!hidden",
      }),
    )
    const normalized = new Map((data?.query?.normalized ?? []).map(({ from, to }) => [to, from]))
    for (const page of Object.values(data?.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0]
      if (!ii) continue
      const meta = ii.extmetadata ?? {}
      const record = {
        title: page.title,
        pageUrl: ii.descriptionurl,
        thumbUrl: ii.thumburl ?? ii.url,
        originalUrl: ii.url,
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        license: stripHtml(meta.LicenseShortName?.value),
        licenseUrl: stripHtml(meta.LicenseUrl?.value) || null,
        artist: stripHtml(meta.Artist?.value) || null,
        credit: stripHtml(meta.Credit?.value) || null,
        description: stripHtml(meta.ImageDescription?.value).slice(0, 500),
        attributionRequired: meta.AttributionRequired?.value === "true",
        fileCoordinates: page.coordinates?.[0] ? { lat: page.coordinates[0].lat, lon: page.coordinates[0].lon } : null,
        categories: (page.categories ?? []).map((c) => c.title.replace(/^Category:/, "")),
      }
      info.set(page.title, record)
      if (normalized.has(page.title)) info.set(normalized.get(page.title), record)
    }
  }
  return info
}

/** 후보 한 건을 판정한다. 결과: approved(자동 승인) | review(사람 확인 필요) | rejected(이름 불일치·권한 불가) */
export function judgeCandidate(facility, file, extra = {}) {
  const target = normalizeName(facility.name)
  const titleText = normalizeName(file.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""))
  const descText = normalizeName(file.description)
  const catText = normalizeName(file.categories.join(" "))
  const nameMatch = target.length >= 3 && (titleText.includes(target) || descText.includes(target) || catText.includes(target))

  const fileDistance = distanceMeters(facility.coordinates, file.fileCoordinates)
  const wikidataDistance = distanceMeters(facility.coordinates, extra.wikidataCoordinates)
  const textBlob = `${file.title} ${file.description} ${file.categories.join(" ")}`
  const regionMatch = /용인|yongin/i.test(textBlob) && (!facility.district || textBlob.includes(facility.district) ||
    new RegExp(facility.district.replace(/구$/, ""), "i").test(textBlob))
  const locationMatch =
    (fileDistance !== null && fileDistance <= 300) ||
    (wikidataDistance !== null && wikidataDistance <= 500) ||
    regionMatch
  const licenseOk = ALLOWED_LICENSE.test(file.license || "")
  const imageOk = /^image\/(jpeg|png|webp)$/.test(file.mime || "")
  const nearTitle = NEAR_WORDS.test(file.title)

  const reasons = []
  if (!nameMatch) reasons.push("시설명 불일치")
  if (!locationMatch) reasons.push("위치(좌표·용인/구) 확인 불가")
  if (!licenseOk) reasons.push(`허용되지 않은 라이선스: ${file.license || "없음"}`)
  if (!imageOk) reasons.push(`사진 형식 아님: ${file.mime}`)
  if (nearTitle) reasons.push("제목에 인근·주변 표현(시설 외 사진 가능성)")

  let status
  if (!nameMatch || !licenseOk || !imageOk) status = "rejected"
  else if (!locationMatch || nearTitle) status = "review"
  else status = "approved"

  return { status, nameMatch, locationMatch, licenseOk, fileDistance, wikidataDistance, reasons }
}

const readJson = async (file, fallback) =>
  existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : fallback
const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 1)}\n`)

async function collect() {
  await mkdir(DOCS_DIR, { recursive: true })
  // 시설 목록은 한 번 받으면 파일로 두고 재사용한다(새로 받으려면 --refresh-facilities)
  let facilities = process.argv.includes("--refresh-facilities") ? null : await readJson(FACILITIES_FILE, null)
  if (facilities) {
    console.log(`시설 목록 재사용: ${facilities.length}개 (${path.relative(ROOT, FACILITIES_FILE)})`)
  } else {
    facilities = await fetchFacilities()
    await writeJson(FACILITIES_FILE, facilities)
  }
  const backendImages = facilities.filter((f) => f.imageUrl && !/^\/images\/default\//.test(f.imageUrl))
  console.log(`백엔드 실제 이미지 URL 보유 시설: ${backendImages.length}`)

  // 시설별 검색 결과는 한 곳 끝날 때마다 저장해, 중단돼도 끝난 시설은 다시 검색하지 않는다
  const cache = await readJson(SEARCH_CACHE_FILE, { searches: {}, fileInfo: {} })
  const done = () => facilities.filter((f) => cache.searches[f.facilityId]).length
  console.log(`검색 완료 ${done()}/${facilities.length} (이어서 진행)`)
  for (const facility of facilities) {
    if (cache.searches[facility.facilityId]) continue
    const byName = await searchCommonsByName(facility.name)
    const nearby = await searchCommonsNearby(facility.coordinates)
    const wikidata = await searchWikidata(facility.name)
    cache.searches[facility.facilityId] = { byName, nearby, wikidata, searchedAt: new Date().toISOString() }
    await writeJson(SEARCH_CACHE_FILE, cache)
    const count = done()
    if (count % 10 === 0) console.log(`  검색 ${count}/${facilities.length}`)
  }
  const raw = facilities.map((facility) => ({ facility, ...cache.searches[facility.facilityId] }))

  const allTitles = [...new Set(raw.flatMap((r) => [...r.byName, ...r.nearby, ...r.wikidata.map((w) => w.title)]))]
  // --refresh-fileinfo: 검색 결과는 그대로 두고 파일 메타데이터만 다시 받는다
  if (process.argv.includes("--refresh-fileinfo")) cache.fileInfo = {}
  const missing = allTitles.filter((title) => !cache.fileInfo[title])
  console.log(`메타데이터 조회: 파일 ${allTitles.length}개 중 새로 ${missing.length}개`)
  for (const [title, record] of await fetchFileInfo(missing)) cache.fileInfo[title] = record
  await writeJson(SEARCH_CACHE_FILE, cache)
  const info = new Map(Object.entries(cache.fileInfo))

  const results = raw.map(({ facility, byName, nearby, wikidata }) => {
    const sources = new Map()
    for (const title of byName) sources.set(title, { via: ["commons-search"] })
    for (const title of nearby) (sources.get(title)?.via ?? sources.set(title, { via: [] }).get(title).via).push("commons-geosearch")
    for (const w of wikidata) {
      const entry = sources.get(w.title) ?? { via: [] }
      entry.via.push(`wikidata:${w.wikidataId}`)
      entry.wikidataCoordinates = w.wikidataCoordinates
      sources.set(w.title, entry)
    }
    const candidates = []
    for (const [title, extra] of sources) {
      const file = info.get(title)
      if (!file) continue
      const judgement = judgeCandidate(facility, file, extra)
      // 이름이 전혀 맞지 않는 좌표 주변 파일은 기록하지 않는다(다른 건물 사진)
      if (!judgement.nameMatch) continue
      candidates.push({ ...file, via: extra.via, ...judgement })
    }
    const rank = { approved: 0, review: 1, rejected: 2 }
    candidates.sort((a, b) => rank[a.status] - rank[b.status] || (a.fileDistance ?? 1e9) - (b.fileDistance ?? 1e9))
    return { ...facility, candidates }
  })

  await writeFile(
    CANDIDATES_FILE,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), apiBase: API_BASE, facilities: results }, null, 1)}\n`,
  )
  const count = (status) => results.filter((r) => r.candidates.some((c) => c.status === status)).length
  console.log(`자동 승인 후보 보유 시설 ${count("approved")}, 검토 후보 보유 시설 ${count("review")}`)
  console.log(`→ ${path.relative(ROOT, CANDIDATES_FILE)}`)
}

// ── 3. 적용 ───────────────────────────────────────────

/**
 * JPEG에서 EXIF·XMP(APP1)와 주석(COM) 세그먼트를 지운다. 촬영자 GPS·기기 정보가 서비스에 그대로 실리지 않게 한다.
 * 화소 데이터는 건드리지 않는다. JPEG가 아니거나 구조가 예상과 다르면 원본을 그대로 돌려준다.
 */
export function stripJpegMetadata(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer
  const parts = [buffer.subarray(0, 2)]
  let offset = 2
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) return buffer
    const marker = buffer[offset + 1]
    if (marker === 0xda) {
      parts.push(buffer.subarray(offset)) // SOS 이후(화소 데이터)는 그대로
      return Buffer.concat(parts)
    }
    const length = buffer.readUInt16BE(offset + 2)
    const segment = buffer.subarray(offset, offset + 2 + length)
    if (marker !== 0xe1 && marker !== 0xfe) parts.push(segment)
    offset += 2 + length
  }
  return buffer
}

async function apply() {
  const { facilities } = JSON.parse(await readFile(CANDIDATES_FILE, "utf8"))
  const decisions = existsSync(DECISIONS_FILE) ? JSON.parse(await readFile(DECISIONS_FILE, "utf8")) : {}
  await mkdir(IMAGE_DIR, { recursive: true })

  const applied = []
  for (const facility of facilities) {
    const decision = decisions[facility.facilityId]
    let chosen = null
    if (decision?.decision === "approve") {
      chosen = facility.candidates.find((c) => c.title === decision.title)
      if (chosen && !chosen.licenseOk) {
        console.warn(`  ${facility.facilityId} 사람 승인이지만 권한 조건 불충족 → 적용 안 함`)
        chosen = null
      }
    } else if (decision?.decision !== "reject") {
      chosen = facility.candidates.find((c) => c.status === "approved" && !(decision?.rejectTitles ?? []).includes(c.title))
    }
    if (!chosen) continue

    const ext = chosen.thumbUrl.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? "jpg"
    const fileName = `${facility.facilityId}.${ext}`
    const response = await fetch(chosen.thumbUrl, { headers: { "User-Agent": USER_AGENT } })
    if (!response.ok) {
      console.warn(`  ${facility.facilityId} 다운로드 실패 HTTP ${response.status}`)
      continue
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    await writeFile(path.join(IMAGE_DIR, fileName), ext === "jpg" ? stripJpegMetadata(bytes) : bytes)
    await sleep(requestGapMs)
    applied.push({
      facilityId: facility.facilityId,
      facilityName: facility.name,
      address: facility.address,
      path: `/images/facilities/${fileName}`,
      sourceTitle: chosen.title,
      sourcePage: chosen.pageUrl,
      originalUrl: chosen.originalUrl,
      license: chosen.license,
      licenseUrl: chosen.licenseUrl,
      artist: chosen.artist,
      credit: chosen.credit,
      verification: {
        automatic: chosen.status === "approved",
        humanDecision: decision?.decision ?? null,
        humanNote: decision?.note ?? null,
        via: chosen.via,
        fileDistanceMeters: chosen.fileDistance,
        wikidataDistanceMeters: chosen.wikidataDistance,
      },
    })
  }

  await writeFile(SOURCES_FILE, `${JSON.stringify({ generatedAt: new Date().toISOString(), images: applied }, null, 1)}\n`)
  const esc = (text) => JSON.stringify(text ?? "")
  const lines = [
    "/**",
    " * 검증된 시설별 실제 사진 (scripts/collect-facility-images.mjs apply 가 생성한다. 직접 고치지 말 것).",
    " * 출처·라이선스 전체 기록: docs/facility-images/sources.json",
    " * 사진이 없는 시설은 여기 없고, 매퍼가 백엔드 이미지 → 유형별 기본 이미지 순으로 대신한다.",
    " */",
    "export const facilityImages: Record<string, string> = {",
    ...applied.map((a) => `  ${esc(a.facilityId)}: ${esc(a.path)}, // ${a.facilityName}`),
    "}",
    "",
    "/** 사진 저작자 표시 문구(CC BY·BY-SA는 표시 의무가 있다) */",
    "export const facilityImageCredits: Record<string, string> = {",
    ...applied.map((a) => `  ${esc(a.facilityId)}: ${esc(`${a.artist || "작성자 미상"} / ${a.license} / Wikimedia Commons`)},`),
    "}",
    "",
  ]
  await writeFile(MAP_FILE, lines.join("\n"))
  await writeResults(facilities, applied, decisions)
  console.log(`적용 ${applied.length}개 → ${path.relative(ROOT, MAP_FILE)}, ${path.relative(ROOT, SOURCES_FILE)}`)
}

/** 시설별 결과표(docs/facility-images/results.md, results.csv) */
async function writeResults(facilities, applied, decisions) {
  const appliedById = new Map(applied.map((a) => [a.facilityId, a]))
  const rows = facilities.map((facility) => {
    const done = appliedById.get(facility.facilityId)
    const decision = decisions[facility.facilityId]
    let result
    let detail
    if (done) {
      result = "적용"
      detail = `${done.sourceTitle} (${done.license}, ${done.artist ?? "작성자 미상"})`
    } else if (facility.candidates.length) {
      result = "후보 제외"
      detail = decision?.note ?? facility.candidates.map((c) => `${c.title}: ${c.reasons.join(", ")}`).join(" / ")
    } else {
      result = "미확보"
      detail = "이름이 일치하는 공개 라이선스 사진 없음(Commons·Wikidata) → 유형별 기본 이미지 유지"
    }
    return { id: facility.facilityId, name: facility.name, type: facility.typeName, district: facility.district, address: facility.address, result, detail }
  })
  const count = (result) => rows.filter((row) => row.result === result).length
  const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")
  const md = [
    "# 시설별 실제 사진 확보 결과",
    "",
    `생성: ${new Date().toISOString()} · \`node scripts/collect-facility-images.mjs apply\``,
    "",
    `- 전체 시설: ${rows.length}`,
    `- 실제 사진 적용: ${count("적용")}`,
    `- 후보가 있었으나 제외: ${count("후보 제외")}`,
    `- 후보 없음(미확보): ${count("미확보")}`,
    `- 사진 미적용 시설 합계: ${rows.length - count("적용")} (유형별 기본 이미지 유지)`,
    "",
    "| ID | 시설명 | 유형 | 구 | 주소 | 결과 | 비고 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.id} | ${cell(r.name)} | ${r.type} | ${r.district} | ${cell(r.address)} | ${r.result} | ${cell(r.detail)} |`),
    "",
  ]
  await writeFile(path.join(DOCS_DIR, "results.md"), md.join("\n"))
  const csv = (text) => `"${String(text ?? "").replace(/"/g, '""')}"`
  await writeFile(
    path.join(DOCS_DIR, "results.csv"),
    `﻿${["id,name,type,district,address,result,detail", ...rows.map((r) => [r.id, r.name, r.type, r.district, r.address, r.result, r.detail].map(csv).join(","))].join("\n")}\n`,
  )
}

const command = process.argv[2]
if (command === "collect") await collect()
else if (command === "apply") await apply()
else if (command) {
  console.error("사용법: node scripts/collect-facility-images.mjs <collect|apply>")
  process.exit(1)
}
