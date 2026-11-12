import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoSearchPanel,
} from "../../components/common/StatePanels"
import type {
  FacilitySummary,
  FacilityTypeOption,
  SearchFilters,
} from "../../types/facility"
import { FacilityMap } from "./FacilityMap"

interface Props {
  applied: SearchFilters
  submitted: boolean
  loading: boolean
  error: boolean
  results: FacilitySummary[]
  /** 희망 시간에 이용 가능한 시설 수 */
  availableCount: number
  /** A01 시설 유형 선택지 */
  facilityTypes: FacilityTypeOption[]
  onSearch: () => void
  onRetry: () => void
  onTypeChange: (value: SearchFilters["facilityTypeId"]) => void
  selectedId?: string
  onSelect: (id: string) => void
  onOpenFacility: (facility: FacilitySummary) => void
  onEditFilters: () => void
  onGoHome: () => void
}

export function MapPage({
  applied,
  submitted,
  loading,
  error,
  results,
  availableCount,
  facilityTypes,
  onSearch,
  onRetry,
  onTypeChange,
  selectedId,
  onSelect,
  onOpenFacility,
  onEditFilters,
  onGoHome,
}: Props) {
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
          {loading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel onRetry={onRetry} />
          ) : !submitted ? (
            <NoSearchPanel onSearch={onSearch} />
          ) : (
            <EmptyPanel onEditFilters={onEditFilters} onGoHome={onGoHome} />
          )}
        </div>
      </main>
    )
  }

  return (
    <main>
      <FacilityMap
        facilities={results}
        availableCount={availableCount}
        facilityTypes={facilityTypes}
        filters={applied}
        selectedId={selectedId}
        onSelect={onSelect}
        onOpen={onOpenFacility}
        onTypeChange={onTypeChange}
        onEditFilters={onEditFilters}
      />
    </main>
  )
}
