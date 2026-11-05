import { AlertTriangle, Building2, LoaderCircle, RotateCcw, Search } from "lucide-react"

export function LoadingPanel() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-surface">
      <LoaderCircle className="h-8 w-8 animate-spin text-accent-sky" />
      <p className="mt-4 text-sm font-bold text-text-secondary">
        운영시간을 확인하고 있어요
      </p>
    </div>
  )
}

interface NoSearchPanelProps {
  onSearch: () => void
}

export function NoSearchPanel({ onSearch }: NoSearchPanelProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 text-center">
      <span className="rounded-2xl bg-primary-light p-4 text-accent-sky">
        <Search className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-lg font-extrabold">검색 조건을 설정해주세요</h3>
      <p className="mt-2 text-sm text-text-secondary">
        원하는 요일과 시간을 선택해 이용 가능한 시설을 찾아보세요.
      </p>
      <button
        onClick={onSearch}
        className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover"
      >
        현재 조건으로 검색
      </button>
    </div>
  )
}

export function EmptyPanel() {
  return (
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
}

interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 text-center">
      <AlertTriangle className="h-10 w-10 text-error" />
      <h3 className="mt-4 text-lg font-extrabold">
        시설 정보를 불러오지 못했어요
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={onRetry}
        className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-primary hover:bg-primary-hover"
      >
        <RotateCcw className="h-4 w-4" /> 다시 시도
      </button>
    </div>
  )
}
