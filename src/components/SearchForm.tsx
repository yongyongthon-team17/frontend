import { Search, X } from "lucide-react"
import type { FormEvent } from "react"
import type { SearchFilters } from "../types/facility"
import { TIME_OPTIONS, WEEKDAYS } from "../utils/timeUtils"

interface Props {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onSubmit: () => void
  loading?: boolean
  compact?: boolean
}

const selectClass =
  "h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-text-primary outline-none transition focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary/40"

export function SearchForm({
  filters,
  onChange,
  onSubmit,
  loading,
  compact,
}: Props) {
  const invalidTime = filters.endTime <= filters.startTime
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalidTime) onSubmit()
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl bg-surface ${
        compact ? "p-0" : "border border-border p-4 sm:p-6"
      }`}
    >
      <div className="grid grid-cols-12 gap-4">
        <label className="col-span-12 lg:col-span-5">
          <span className="mb-2 block text-xs font-bold text-text-secondary">
            키워드
          </span>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/55" />
            <input
              value={filters.keyword}
              onChange={(e) =>
                onChange({ ...filters, keyword: e.target.value })
              }
              placeholder="시설명이나 주소로 검색해 보세요"
              className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm outline-none transition placeholder:text-text-secondary/55 focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary/40"
            />
            {filters.keyword && (
              <button
                type="button"
                onClick={() => onChange({ ...filters, keyword: "" })}
                aria-label="검색어 지우기"
                className="absolute right-3 top-3 rounded-lg p-1 text-text-secondary/60 hover:bg-background-soft hover:text-forest"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </label>
        <label className="col-span-12 md:col-span-4 lg:col-span-3">
          <span className="mb-2 block text-xs font-bold text-text-secondary">
            지역
          </span>
          <select
            value={filters.district}
            onChange={(e) =>
              onChange({
                ...filters,
                district: e.target.value as SearchFilters["district"],
              })
            }
            className={selectClass}
          >
            <option value="전체">용인시 전체</option>
            <option>수지구</option>
            <option>기흥구</option>
            <option>처인구</option>
          </select>
        </label>
        <div className="col-span-12 md:col-span-8 lg:col-span-4">
          <span className="mb-2 block text-xs font-bold text-text-secondary">
            요일
          </span>
          <div className="flex h-12 items-center gap-1 rounded-xl bg-background p-1">
            {WEEKDAYS.slice(1)
              .concat(WEEKDAYS[0])
              .map((day, index) => {
                const value = index === 6 ? 0 : index + 1
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onChange({ ...filters, weekday: value })}
                    className={`h-10 min-w-0 flex-1 rounded-lg text-sm font-bold transition ${
                      filters.weekday === value
                        ? "border border-primary bg-light-sky text-text-primary"
                        : "text-text-secondary hover:bg-white"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
          </div>
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-5">
          <span className="mb-2 block text-xs font-bold text-text-secondary">
            이용 시간
          </span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <select
              aria-label="시작 시간"
              value={filters.startTime}
              onChange={(e) =>
                onChange({ ...filters, startTime: e.target.value })
              }
              className={selectClass}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
            <span className="text-text-secondary/60">—</span>
            <select
              aria-label="종료 시간"
              value={filters.endTime}
              onChange={(e) =>
                onChange({ ...filters, endTime: e.target.value })
              }
              className={selectClass}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-span-12 flex items-end md:col-span-5 lg:col-span-3">
          <button
            disabled={invalidTime || loading}
            className="h-12 w-full rounded-xl bg-primary px-4 text-sm font-bold text-text-primary transition hover:bg-primary-hover active:translate-y-px active:bg-primary-active disabled:cursor-not-allowed disabled:bg-text-secondary/25"
          >
            {loading ? "찾는 중…" : "열린 시설 찾기"}
          </button>
        </div>
      </div>
      {invalidTime && (
        <p className="mt-3 text-sm font-semibold text-error">
          종료 시간은 시작 시간보다 늦어야 해요.
        </p>
      )}
    </form>
  )
}
