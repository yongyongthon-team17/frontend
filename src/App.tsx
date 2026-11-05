import {
  AlertTriangle,
  ArrowRight,
  Building2,
  LoaderCircle,
  MapPinned,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { FacilityCard } from "./components/FacilityCard"
import { FacilityDetailDrawer } from "./components/FacilityDetailDrawer"
import { FacilityMap } from "./components/FacilityMap"
import { Header } from "./components/Header"
import { MobileBottomNav } from "./components/MobileBottomNav"
import { SearchForm } from "./components/SearchForm"
import { MOCK_FACILITIES } from "./data/mockFacilities"
import type { Facility, SearchFilters } from "./types/facility"
import { filterFacilities } from "./utils/facilityFilters"
import { WEEKDAYS } from "./utils/timeUtils"

type AppScreen = "home" | "search" | "map"

const today = new Date().getDay()
const weekendDefaults = today === 0 ? ["10:00", "12:00"] : ["16:00", "18:00"]

const DEFAULT_FILTERS: SearchFilters = {
  keyword: "",
  district: "전체",
  weekday: today,
  startTime: today === 0 || today === 6 ? weekendDefaults[0] : "18:00",
  endTime: today === 0 || today === 6 ? weekendDefaults[1] : "20:00",
  facilityType: "전체",
}

const FACILITY_TYPES: SearchFilters["facilityType"][] = [
  "전체",
  "공공도서관",
  "평생학습관",
  "생활체육시설",
]

interface PersistedSearch {
  draft: SearchFilters
  applied: SearchFilters
  submitted: boolean
}

function getScreenFromHash(): AppScreen {
  const value = window.location.hash.replace("#/", "")
  return value === "search" || value === "map" ? value : "home"
}

function loadPersistedSearch(): PersistedSearch | null {
  try {
    const value = window.sessionStorage.getItem("jigeumgayong-search")
    return value ? JSON.parse(value) as PersistedSearch : null
  } catch {
    return null
  }
}

interface ChipProps {
  value: SearchFilters["facilityType"]
  onChange: (value: SearchFilters["facilityType"]) => void
}

function FacilityTypeChips({ value, onChange }: ChipProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FACILITY_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
            value === type
              ? "border-primary bg-light-sky text-text-primary"
              : "border-border bg-surface text-text-secondary hover:border-primary"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const persisted = useRef(loadPersistedSearch()).current
  const [draft, setDraft] = useState(persisted?.draft ?? DEFAULT_FILTERS)
  const [applied, setApplied] = useState(persisted?.applied ?? DEFAULT_FILTERS)
  const [submitted, setSubmitted] = useState(persisted?.submitted ?? false)
  const [screen, setScreen] = useState<AppScreen>(getScreenFromHash)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [mapFiltersOpen, setMapFiltersOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  )
  const [mapSelectedId, setMapSelectedId] = useState<string>()

  const results = useMemo(
    () => filterFacilities(MOCK_FACILITIES, applied),
    [applied],
  )

  useEffect(() => {
    if (!["#/home", "#/search", "#/map"].includes(window.location.hash)) {
      window.history.replaceState(null, "", "#/home")
    }
    const handleHashChange = () => {
      setScreen(getScreenFromHash())
      setSelectedFacility(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem(
      "jigeumgayong-search",
      JSON.stringify({ draft, applied, submitted }),
    )
  }, [draft, applied, submitted])

  const commitNavigation = (next: AppScreen) => {
    const hash = `#/${next}`
    if (window.location.hash === hash) {
      setScreen(next)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.location.hash = `/${next}`
    }
  }

  const performSearch = (destination: "search" | "map" = "search") => {
    if (draft.endTime <= draft.startTime) return
    setLoading(true)
    setError(false)
    window.setTimeout(() => {
      setApplied(draft)
      setSubmitted(true)
      setLoading(false)
      commitNavigation(destination)
    }, 420)
  }

  const navigate = (next: AppScreen) => {
    if (next === "map" && !submitted) {
      performSearch("map")
      return
    }
    commitNavigation(next)
  }

  const setType = (facilityType: SearchFilters["facilityType"]) => {
    setDraft((current) => ({ ...current, facilityType }))
    setApplied((current) => ({ ...current, facilityType }))
  }

  const conditionLabel = `${WEEKDAYS[applied.weekday]}요일 ${applied.startTime}–${applied.endTime}`

  const loadingPanel = (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-surface">
      <LoaderCircle className="h-8 w-8 animate-spin text-accent-sky" />
      <p className="mt-4 text-sm font-bold text-text-secondary">
        운영시간을 확인하고 있어요
      </p>
    </div>
  )

  const renderHome = () => (
    <>
      <section className="hero-grid border-b border-border">
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold text-accent-sky">
              용인시 공공시설 통합 검색
            </p>
            <h1 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.04em] text-text-primary sm:text-[38px]">
              원하는 시간에 이용 가능한
              <br />
              공공시설을 찾아보세요
            </h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base">
              지역과 요일, 이용 시간을 선택하면 운영 중인 시설만 확인할 수
              있어요.
            </p>
          </div>
          <div className="mt-8 max-w-[1120px]">
            <SearchForm
              filters={draft}
              onChange={setDraft}
              onSubmit={() => performSearch("search")}
              loading={loading}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6">
          <p className="text-sm font-extrabold text-accent-sky">바로가기</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
            어떻게 찾아볼까요?
          </h2>
        </div>
        <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate("search")}
            className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary"
          >
            <span className="flex items-center gap-4">
              <span className="rounded-xl bg-primary-light p-3 text-accent-sky">
                <Search className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-base text-forest">
                  조건에 맞는 시설 찾기
                </strong>
                <small className="mt-1 block text-xs text-text-secondary">
                  검색 조건을 세밀하게 설정해요
                </small>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-text-secondary transition group-hover:translate-x-1 group-hover:text-accent-sky" />
          </button>
          <button
            onClick={() => navigate("map")}
            className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary"
          >
            <span className="flex items-center gap-4">
              <span className="rounded-xl bg-primary-light p-3 text-accent-sky">
                <MapPinned className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-base text-forest">
                  지도에서 시설 탐색하기
                </strong>
                <small className="mt-1 block text-xs text-text-secondary">
                  검색 결과의 위치를 함께 살펴봐요
                </small>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-text-secondary transition group-hover:translate-x-1 group-hover:text-accent-sky" />
          </button>
        </div>
      </section>
    </>
  )

  const renderNoSearch = (destination: "search" | "map") => (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 text-center">
      <span className="rounded-2xl bg-primary-light p-4 text-accent-sky">
        <Search className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-lg font-extrabold">검색 조건을 설정해주세요</h3>
      <p className="mt-2 text-sm text-text-secondary">
        원하는 요일과 시간을 선택해 이용 가능한 시설을 찾아보세요.
      </p>
      <button
        onClick={() => performSearch(destination)}
        className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover"
      >
        현재 조건으로 검색
      </button>
    </div>
  )

  const renderEmpty = () => (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 text-center">
      <span className="rounded-2xl bg-primary-light p-4 text-accent-sky">
        <Building2 className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-xl font-extrabold">
        이 시간에 열린 시설이 없어요
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        요일이나 시간을 변경해 다시 검색해 보세요.
      </p>
    </div>
  )

  const renderError = (destination: "search" | "map") => (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 text-center">
      <AlertTriangle className="h-10 w-10 text-error" />
      <h3 className="mt-4 text-lg font-extrabold">
        시설 정보를 불러오지 못했어요
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={() => {
          setError(false)
          performSearch(destination)
        }}
        className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover"
      >
        <RotateCcw className="h-4 w-4" /> 다시 시도
      </button>
    </div>
  )

  const renderSearch = () => (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="text-sm font-extrabold text-accent-sky">시설 찾기</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
          이용 가능한 시설을 찾아보세요
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          검색 조건과 결과를 한 화면에서 확인하고 바로 수정할 수 있어요.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-accent-sky" />
          <h2 className="text-base font-extrabold">검색 조건</h2>
        </div>
        <SearchForm
          compact
          filters={draft}
          onChange={setDraft}
          onSubmit={() => performSearch("search")}
          loading={loading}
        />
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-accent-sky">
              {submitted ? conditionLabel : "검색 전"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">
              이용 가능한 시설{" "}
              <span className="text-accent-sky">
                {submitted ? results.length : 0}
              </span>
              곳
            </h2>
          </div>
          <button
            onClick={() => navigate("map")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-4 text-sm font-bold text-forest transition hover:bg-primary-light"
          >
            <MapPinned className="h-4 w-4" /> 지도에서 보기
          </button>
        </div>
        <div className="mt-6">
          <FacilityTypeChips value={applied.facilityType} onChange={setType} />
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary-light px-4 py-3 text-xs text-text-secondary">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent-sky" />
          현재 시설 정보는 제품 시연을 위한 가상 데이터이며 실제 공공시설 정보가
          아닙니다.
        </div>

        <div className="mt-6">
          {loading ? (
            loadingPanel
          ) : error ? (
            renderError("search")
          ) : !submitted ? (
            renderNoSearch("search")
          ) : !results.length ? (
            renderEmpty()
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  weekday={applied.weekday}
                  onClick={() => setSelectedFacility(facility)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )

  const renderMap = () => {
    if (loading || error || !submitted || !results.length) {
      return (
        <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
          <div>
            <p className="text-sm font-extrabold text-accent-sky">지도 보기</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
              지도에서 시설을 탐색하세요
            </h1>
          </div>
          <div className="mt-8">
            {loading
              ? loadingPanel
              : error
                ? renderError("map")
                : !submitted
                  ? renderNoSearch("map")
                  : renderEmpty()}
          </div>
        </main>
      )
    }

    return (
      <main>
        <FacilityMap
          facilities={results}
          filters={applied}
          selectedId={mapSelectedId}
          onSelect={setMapSelectedId}
          onOpen={setSelectedFacility}
          onTypeChange={setType}
          onEditFilters={() => setMapFiltersOpen(true)}
        />
      </main>
    )
  }

  return (
    <div
      className={`min-h-screen bg-background text-text-primary ${
        screen === "map"
          ? "pb-0"
          : "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
      }`}
    >
      <Header active={screen} onNavigate={navigate} />

      {screen === "home" && renderHome()}
      {screen === "search" && renderSearch()}
      {screen === "map" && renderMap()}

      {screen !== "map" && (
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-2 px-4 py-7 text-xs text-text-secondary/65 sm:flex-row sm:items-center sm:px-6">
            <p>
              <strong className="mr-2 text-forest">지금가용</strong>
              운영정보는 실제 예약 가능 여부와 다를 수 있습니다.
            </p>
            <p>Hackathon MVP · Demo data only</p>
          </div>
        </footer>
      )}

      {selectedFacility && (
        <FacilityDetailDrawer
          facility={selectedFacility}
          filters={applied}
          onClose={() => setSelectedFacility(null)}
        />
      )}
      {screen === "map" && mapFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="검색 조건 변경"
        >
          <button
            className="absolute inset-0 cursor-default bg-forest/30"
            onClick={() => setMapFiltersOpen(false)}
            aria-label="검색 조건 닫기"
          />
          <section className="relative z-10 w-full max-w-4xl rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">검색 조건 변경</h2>
              <button
                onClick={() => setMapFiltersOpen(false)}
                className="rounded-full border border-border p-2 text-text-secondary hover:text-forest"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SearchForm
              compact
              filters={draft}
              onChange={setDraft}
              onSubmit={() => {
                setMapFiltersOpen(false)
                performSearch("map")
              }}
              loading={loading}
            />
          </section>
        </div>
      )}
      {!selectedFacility && (
        <MobileBottomNav active={screen} onNavigate={navigate} />
      )}
    </div>
  )
}
