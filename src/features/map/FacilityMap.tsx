import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  SlidersHorizontal,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FACILITY_TYPES } from "../../constants/facility"
import type {
  Facility,
  FacilityTypeFilter,
  SearchFilters,
} from "../../types/facility"
import { formatHours, WEEKDAYS } from "../../utils/timeUtils"

interface Props {
  facilities: Facility[]
  filters: SearchFilters
  selectedId?: string
  onSelect: (id: string) => void
  onOpen: (facility: Facility) => void
  onTypeChange: (value: FacilityTypeFilter) => void
  onEditFilters: () => void
}

const position = (facility: Facility) => {
  const lat = facility.latitude ?? 37.27
  const lng = facility.longitude ?? 127.13
  return {
    left: `${Math.min(88, Math.max(15, 16 + ((lng - 127.07) / 0.15) * 65))}%`,
    top: `${Math.min(82, Math.max(13, 15 + ((37.34 - lat) / 0.12) * 65))}%`,
  }
}

interface SummaryProps {
  filters: SearchFilters
}

function SearchSummary({ filters }: SummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-primary-light p-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
          <MapPin className="h-3 w-3" /> 지역
        </p>
        <p className="mt-1 truncate text-xs font-extrabold text-forest">
          {filters.district === "전체" ? "용인시 전체" : filters.district}
        </p>
      </div>
      <div className="min-w-0 border-x border-border px-2">
        <p className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
          <CalendarDays className="h-3 w-3" /> 요일
        </p>
        <p className="mt-1 text-xs font-extrabold text-forest">
          {WEEKDAYS[filters.weekday]}요일
        </p>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
          <Clock3 className="h-3 w-3" /> 시간
        </p>
        <p className="mt-1 truncate text-xs font-extrabold text-forest">
          {filters.startTime}–{filters.endTime}
        </p>
      </div>
    </div>
  )
}

interface ChipsProps {
  value: FacilityTypeFilter
  onChange: (value: FacilityTypeFilter) => void
  compact?: boolean
}

function TypeChips({ value, onChange, compact }: ChipsProps) {
  return (
    <div
      className={`flex gap-2 ${compact ? "overflow-x-auto pb-1" : "flex-wrap"}`}
    >
      {FACILITY_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            value === type
              ? "border-primary bg-light-sky text-forest"
              : "border-border bg-white text-text-secondary hover:border-primary"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

interface ListCardProps {
  facility: Facility
  weekday: number
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  itemRef?: (node: HTMLDivElement | null) => void
}

function MapListCard({
  facility,
  weekday,
  selected,
  onSelect,
  onOpen,
  itemRef,
}: ListCardProps) {
  return (
    <article
      ref={itemRef}
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border bg-white p-4 transition ${
        selected ? "border-primary" : "border-border hover:border-primary"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-accent-sky">
            {facility.type} · {facility.district}
          </p>
          <h3 className="mt-1 truncate text-base font-extrabold text-forest">
            {facility.name}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-success-light px-2 py-1 text-[10px] font-bold text-success">
          이용 가능
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-text-secondary">
        {facility.address}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        <Clock3 className="h-3.5 w-3.5 text-accent-sky" />
        {formatHours(facility.weeklyHours[weekday])}
      </p>
      <button
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
        className="mt-4 flex w-full items-center justify-between border-t border-border pt-3 text-xs font-extrabold text-forest"
      >
        상세 정보 보기 <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  )
}

export function FacilityMap({
  facilities,
  filters,
  selectedId,
  onSelect,
  onOpen,
  onTypeChange,
  onEditFilters,
}: Props) {
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const desktopRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const mobileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const selectedFacility = facilities.find(
    (facility) => facility.id === selectedId,
  )

  useEffect(() => {
    if (!selectedId) return
    desktopRefs.current[selectedId]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    })
    if (sheetExpanded) {
      mobileRefs.current[selectedId]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [selectedId, sheetExpanded])

  return (
    <div className="relative h-[calc(100dvh-64px)] overflow-hidden bg-background lg:grid lg:grid-cols-[minmax(360px,38%)_1fr]">
      <aside className="hidden min-h-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-6">
          <p className="text-sm font-extrabold text-accent-sky">지도 보기</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">
            지도에서 시설 찾기
          </h1>
          <p className="mt-2 text-xs leading-5 text-text-secondary">
            마커 또는 시설 카드를 선택해 위치와 상세 정보를 확인하세요.
          </p>
          <div className="mt-5">
            <SearchSummary filters={filters} />
          </div>
          <button
            onClick={onEditFilters}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-accent-sky"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> 검색 조건 변경
          </button>
          <div className="mt-5">
            <TypeChips value={filters.facilityType} onChange={onTypeChange} />
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-extrabold text-forest">시설 목록</p>
          <p className="text-xs text-text-secondary">
            이용 가능{" "}
            <strong className="text-forest">{facilities.length}</strong>곳
          </p>
        </div>
        <div className="map-list-scroll flex-1 space-y-3 overflow-y-auto p-4">
          {facilities.map((facility) => (
            <MapListCard
              key={facility.id}
              facility={facility}
              weekday={filters.weekday}
              selected={facility.id === selectedId}
              onSelect={() => onSelect(facility.id)}
              onOpen={() => onOpen(facility)}
              itemRef={(node) => {
                desktopRefs.current[facility.id] = node
              }}
            />
          ))}
        </div>
      </aside>

      <div className="demo-map relative h-full min-w-0 overflow-hidden bg-background-soft">
        <div className="absolute inset-x-3 top-3 z-30 rounded-2xl border border-border bg-white p-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-forest">
              지도에서 시설 찾기
            </p>
            <button
              onClick={onEditFilters}
              className="flex items-center gap-1 text-xs font-bold text-accent-sky"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> 조건 변경
            </button>
          </div>
          <div className="mt-3">
            <SearchSummary filters={filters} />
          </div>
          <div className="mt-3">
            <TypeChips
              compact
              value={filters.facilityType}
              onChange={onTypeChange}
            />
          </div>
        </div>

        <div className="absolute left-5 top-5 z-20 hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-text-secondary lg:flex">
          <MapPin className="h-4 w-4 text-accent-sky" />
          Kakao Maps API 연결 전 · 데모 지도
        </div>
        <div className="absolute inset-0 opacity-80">
          <span className="map-road road-a" />
          <span className="map-road road-b" />
          <span className="map-road road-c" />
          <span className="map-river" />
          <span className="map-park park-a" />
          <span className="map-park park-b" />
          <span className="absolute left-[46%] top-[43%] text-xs font-bold text-text-secondary/70">
            기흥구
          </span>
          <span className="absolute left-[22%] top-[27%] text-xs font-bold text-text-secondary/70">
            수지구
          </span>
          <span className="absolute left-[73%] top-[67%] text-xs font-bold text-text-secondary/70">
            처인구
          </span>
        </div>
        {facilities.map((facility, index) => {
          const selected = selectedId === facility.id
          return (
            <button
              key={facility.id}
              onClick={() => onSelect(facility.id)}
              style={position(facility)}
              aria-label={`${facility.name} 마커`}
              className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-all ${
                selected ? "z-20 scale-110" : "hover:scale-105"
              }`}
            >
              {selected && (
                <span className="absolute bottom-[44px] left-1/2 hidden w-max max-w-[190px] -translate-x-1/2 rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white lg:block">
                  {facility.name}
                </span>
              )}
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] ${
                  selected
                    ? "border-primary bg-deep-sky"
                    : "border-white bg-main-sky"
                }`}
              >
                <MapPin className="h-5 w-5 text-white" fill="currentColor" />
              </span>
              <span className="mt-1 inline-flex min-w-5 justify-center rounded-full border border-border bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-forest">
                {index + 1}
              </span>
            </button>
          )
        })}
      </div>

      <section
        className={`absolute inset-x-3 z-30 overflow-hidden rounded-2xl border border-border bg-white transition-[height] duration-200 lg:hidden ${
          sheetExpanded ? "bottom-20 h-[52vh]" : "bottom-20 h-[92px]"
        }`}
      >
        <button
          onClick={() => setSheetExpanded((current) => !current)}
          className="flex h-[92px] w-full items-center justify-between gap-3 px-4 text-left"
          aria-expanded={sheetExpanded}
        >
          <span className="min-w-0">
            <small className="block text-[11px] font-bold text-accent-sky">
              이용 가능한 시설 {facilities.length}곳
            </small>
            <strong className="mt-1 block truncate text-sm text-forest">
              {selectedFacility?.name ?? "시설 목록을 확인해보세요"}
            </strong>
            {selectedFacility && (
              <span className="mt-1 block truncate text-[11px] text-text-secondary">
                {formatHours(selectedFacility.weeklyHours[filters.weekday])}
              </span>
            )}
          </span>
          {sheetExpanded ? (
            <ChevronDown className="h-5 w-5 shrink-0 text-text-secondary" />
          ) : (
            <ChevronUp className="h-5 w-5 shrink-0 text-text-secondary" />
          )}
        </button>
        <div className="map-list-scroll h-[calc(52vh-92px)] space-y-3 overflow-y-auto border-t border-border p-3">
          {facilities.map((facility) => (
            <MapListCard
              key={facility.id}
              facility={facility}
              weekday={filters.weekday}
              selected={facility.id === selectedId}
              onSelect={() => onSelect(facility.id)}
              onOpen={() => onOpen(facility)}
              itemRef={(node) => {
                mobileRefs.current[facility.id] = node
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
