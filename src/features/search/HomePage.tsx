import { ArrowRight, MapPinned, Search } from "lucide-react"
import type { SearchFilters } from "../../types/facility"
import type { AppScreen } from "../../types/navigation"
import { SearchForm } from "./SearchForm"

interface Props {
  draft: SearchFilters
  onDraftChange: (filters: SearchFilters) => void
  onSearch: () => void
  loading: boolean
  onNavigate: (screen: AppScreen) => void
}

export function HomePage({
  draft,
  onDraftChange,
  onSearch,
  loading,
  onNavigate,
}: Props) {
  return (
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
              onChange={onDraftChange}
              onSubmit={onSearch}
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
            onClick={() => onNavigate("search")}
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
            onClick={() => onNavigate("map")}
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
}
