import { useEffect, useMemo, useRef, useState } from "react"
import { getFacilities } from "../../api/facilityApi"
import type { SearchFilters } from "../../types/facility"
import type { SearchDestination } from "../../types/navigation"
import { filterFacilities } from "./facilityFilters"

const STORAGE_KEY = "jigeumgayong-search"

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

interface PersistedSearch {
  draft: SearchFilters
  applied: SearchFilters
  submitted: boolean
}

function loadPersistedSearch(): PersistedSearch | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as PersistedSearch : null
  } catch {
    return null
  }
}

interface Options {
  /** 검색이 끝난 뒤 결과 화면으로 이동할 때 호출 */
  onComplete: (destination: SearchDestination) => void
}

/**
 * 검색 조건(draft: 입력 중 / applied: 적용됨), 검색 여부, 로딩·에러 상태와
 * 검색 결과를 관리한다. 조건은 sessionStorage에 저장되어 새로고침 후에도 유지된다.
 */
export function useFacilitySearch({ onComplete }: Options) {
  const persisted = useRef(loadPersistedSearch()).current
  const [draft, setDraft] = useState(persisted?.draft ?? DEFAULT_FILTERS)
  const [applied, setApplied] = useState(persisted?.applied ?? DEFAULT_FILTERS)
  const [submitted, setSubmitted] = useState(persisted?.submitted ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const results = useMemo(
    () => filterFacilities(getFacilities(), applied),
    [applied],
  )

  useEffect(() => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ draft, applied, submitted }),
    )
  }, [draft, applied, submitted])

  const performSearch = (destination: SearchDestination = "search") => {
    if (draft.endTime <= draft.startTime) return
    setLoading(true)
    setError(false)
    window.setTimeout(() => {
      setApplied(draft)
      setSubmitted(true)
      setLoading(false)
      onComplete(destination)
    }, 420)
  }

  const retrySearch = (destination: SearchDestination) => {
    setError(false)
    performSearch(destination)
  }

  /** 유형 칩은 검색 버튼 없이 즉시 결과에 반영된다 */
  const setType = (facilityType: SearchFilters["facilityType"]) => {
    setDraft((current) => ({ ...current, facilityType }))
    setApplied((current) => ({ ...current, facilityType }))
  }

  return {
    draft,
    setDraft,
    applied,
    submitted,
    loading,
    error,
    results,
    performSearch,
    retrySearch,
    setType,
  }
}
