import { X } from "lucide-react"
import type { SearchFilters } from "../../types/facility"
import { SearchForm } from "../search/SearchForm"

interface Props {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onSubmit: () => void
  onClose: () => void
  loading: boolean
}

export function MapFilterModal({
  filters,
  onChange,
  onSubmit,
  onClose,
  loading,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="검색 조건 변경"
    >
      <button
        className="absolute inset-0 cursor-default bg-forest/30"
        onClick={onClose}
        aria-label="검색 조건 닫기"
      />
      <section className="relative z-10 w-full max-w-4xl rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">검색 조건 변경</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-2 text-text-secondary hover:text-forest"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SearchForm
          compact
          filters={filters}
          onChange={onChange}
          onSubmit={onSubmit}
          loading={loading}
        />
      </section>
    </div>
  )
}
