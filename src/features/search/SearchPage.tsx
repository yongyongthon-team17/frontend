import { AlertTriangle, MapPinned, SlidersHorizontal } from "lucide-react"
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoSearchPanel,
} from "../../components/common/StatePanels"
import { USE_MOCK } from "../../api/client"
import type {
  FacilitySummary,
  FacilityTypeOption,
  SearchFilters,
  SearchWarning,
} from "../../types/facility"
import type { AppScreen } from "../../types/navigation"
import { WEEKDAYS } from "../../utils/timeUtils"
import { FacilityCard } from "./FacilityCard"
import { FacilityTypeChips } from "./FacilityTypeChips"
import { SearchForm } from "./SearchForm"

interface Props {
  draft: SearchFilters
  onDraftChange: (filters: SearchFilters) => void
  applied: SearchFilters
  submitted: boolean
  loading: boolean
  error: boolean
  results: FacilitySummary[]
  /** A02 meta.warnings (WEEKLY_SCHEDULE_ONLY 등) */
  warnings: SearchWarning[]
  /** A01 시설 유형 선택지 */
  facilityTypes: FacilityTypeOption[]
  onSearch: () => void
  onRetry: () => void
  onTypeChange: (value: SearchFilters["facilityTypeId"]) => void
  onNavigate: (screen: AppScreen) => void
  onOpenFacility: (facility: FacilitySummary) => void
}

export function SearchPage({
  draft,
  onDraftChange,
  applied,
  submitted,
  loading,
  error,
  results,
  warnings,
  facilityTypes,
  onSearch,
  onRetry,
  onTypeChange,
  onNavigate,
  onOpenFacility,
}: Props) {
  // mock 모드는 가상 데이터 안내, API 모드는 전체 대상 경고(facilityId=null) 문구를 한 줄로 보여준다
  const notice = USE_MOCK
    ? "현재 시설 정보는 제품 시연을 위한 가상 데이터이며 실제 공공시설 정보가 아닙니다."
    : warnings.find((warning) => warning.facilityId === null)?.message
  const conditionLabel = `${WEEKDAYS[applied.weekday]}요일 ${applied.startTime}–${applied.endTime}`

  return (
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
          onChange={onDraftChange}
          onSubmit={onSearch}
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
            onClick={() => onNavigate("map")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-4 text-sm font-bold text-forest transition hover:bg-primary-light"
          >
            <MapPinned className="h-4 w-4" /> 지도에서 보기
          </button>
        </div>
        <div className="mt-6">
          <FacilityTypeChips
            options={facilityTypes}
            value={applied.facilityTypeId}
            onChange={onTypeChange}
          />
        </div>
        {notice && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary-light px-4 py-3 text-xs text-text-secondary">
            <AlertTriangle className="h-4 w-4 shrink-0 text-accent-sky" />
            {notice}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel onRetry={onRetry} />
          ) : !submitted ? (
            <NoSearchPanel onSearch={onSearch} />
          ) : !results.length ? (
            <EmptyPanel />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onClick={() => onOpenFacility(facility)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
