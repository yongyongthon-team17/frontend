import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoSearchPanel,
} from "../../components/common/StatePanels"
import type {
  Facility,
  FacilityTypeFilter,
  SearchFilters,
} from "../../types/facility"
import { FacilityMap } from "./FacilityMap"

interface Props {
  applied: SearchFilters
  submitted: boolean
  loading: boolean
  error: boolean
  results: Facility[]
  onSearch: () => void
  onRetry: () => void
  onTypeChange: (value: FacilityTypeFilter) => void
  selectedId?: string
  onSelect: (id: string) => void
  onOpenFacility: (facility: Facility) => void
  onEditFilters: () => void
}

export function MapPage({
  applied,
  submitted,
  loading,
  error,
  results,
  onSearch,
  onRetry,
  onTypeChange,
  selectedId,
  onSelect,
  onOpenFacility,
  onEditFilters,
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
            <EmptyPanel />
          )}
        </div>
      </main>
    )
  }

  return (
    <main>
      <FacilityMap
        facilities={results}
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
