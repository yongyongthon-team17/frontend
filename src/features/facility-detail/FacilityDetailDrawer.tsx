import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Phone,
  X,
} from "lucide-react"
import { useEffect } from "react"
import { USE_MOCK } from "../../api/client"
import { ErrorPanel, LoadingPanel } from "../../components/common/StatePanels"
import type {
  AvailabilityKind,
  DailyHours,
  Facility,
  SearchFilters,
} from "../../types/facility"
import { WEEKDAYS, formatHours } from "../../utils/timeUtils"
import { AiRecommendation } from "../ai/AiRecommendation"
import { TransportAccessibility } from "./TransportAccessibility"
import { toStatusKind } from "./spaceStatus"
import { useFacilityDetail } from "./useFacilityDetail"

interface Props {
  /** 목록에서 고른 시설(A02 요약). A03 응답이 오기 전 상단 정보에 쓴다 */
  facility: Facility
  filters: SearchFilters
  onClose: () => void
}

const statusContent = {
  available: {
    title: "선택 시간 전체 이용 가능",
    description: "선택한 시간 동안 시설이 계속 운영됩니다.",
    className: "border-success/25 bg-success-light text-success",
    icon: CheckCircle2,
  },
  partial: {
    title: "선택 시간 일부 운영",
    description: "희망 시간 중 운영하지 않는 구간이 있습니다.",
    className: "border-warning/30 bg-warning-light text-warning",
    icon: AlertCircle,
  },
  closed: {
    title: "선택 시간 운영하지 않음",
    description: "해당 요일 또는 시간에는 시설이 운영하지 않습니다.",
    className: "border-error/25 bg-error/5 text-error",
    icon: AlertCircle,
  },
  unknown: {
    title: "운영정보 확인 필요",
    description: "정확한 운영시간을 확인할 수 없습니다.",
    className: "border-border bg-background-soft text-text-secondary",
    icon: AlertCircle,
  },
}

/** 운영시간 섹션에서 공간 하나에 해당하는 상태 카드 + 요일별 표 */
interface HoursBlock {
  key: string
  /** 공간이 하나뿐인 DEFAULT(시설 전체)면 이름을 표시하지 않는다 */
  label: string | null
  kind: AvailabilityKind
  /** 미운영 구간·예약 필요 등 추가 안내 */
  note: string | null
  weeklyHours: Record<number, DailyHours>
}

const DEFAULT_NOTICE =
  "운영시간 기준 판단이며 실제 예약 가능 여부와는 다를 수 있습니다."

export function FacilityDetailDrawer({
  facility: summaryFacility,
  filters,
  onClose,
}: Props) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", close)
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", close)
      document.body.style.overflow = original
    }
  }, [onClose])

  const detail = useFacilityDetail(summaryFacility.id, filters)
  const facility = detail.data?.facility ?? summaryFacility

  const spaces = facility.spaces ?? []
  const showSpaceLabel =
    spaces.length > 1 || spaces.some((space) => space.spaceType !== "DEFAULT")
  const blocks: HoursBlock[] = spaces.length
    ? spaces.map((space) => {
        const kind = toStatusKind(space, filters.startTime, filters.endTime)
        const notes = [
          kind === "partial" && space.unavailableIntervals.length
            ? `미운영 ${space.unavailableIntervals
                .map(({ start, end }) => `${start}–${end}`)
                .join(", ")}`
            : null,
          space.requiresReservation ? "예약이 필요한 공간입니다." : null,
        ].filter((note): note is string => note !== null)
        return {
          key: `${space.spaceType}-${space.spaceLabel}`,
          label: showSpaceLabel ? space.spaceLabel : null,
          kind,
          note: notes.length ? notes.join(" · ") : null,
          weeklyHours: space.weeklyHours,
        }
      })
    : [
        {
          key: "none",
          label: null,
          kind: "unknown",
          note: null,
          weeklyHours: facility.weeklyHours,
        },
      ]

  // meta.warnings 중 시설 공통(facilityId=null)이거나 이 시설 대상인 안내만, 중복 없이
  const warningMessages = [
    ...new Set(
      (detail.data?.warnings ?? [])
        .filter(
          (warning) =>
            warning.facilityId === null || warning.facilityId === facility.id,
        )
        .map((warning) => warning.message),
    ),
  ]
  const notices = warningMessages.length ? warningMessages : [DEFAULT_NOTICE]
  const notFound = detail.error?.code === "FACILITY_NOT_FOUND"

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="시설 상세"
    >
      <button
        aria-label="상세 닫기"
        className="absolute inset-0 cursor-default bg-forest/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="drawer-enter absolute inset-0 w-full overflow-y-auto bg-surface sm:bottom-2 sm:left-auto sm:right-2 sm:top-2 sm:max-w-[480px] sm:rounded-[20px] sm:border sm:border-border">
        <div className="relative h-60 overflow-hidden bg-primary-light sm:rounded-t-[20px]">
          <img
            src={facility.imageUrl}
            alt={facility.imageAlt || ""}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          {USE_MOCK && (
            <span className="absolute left-6 top-6 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-forest backdrop-blur">
              시연용 데이터
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-4 top-4 rounded-full border border-border bg-white/95 p-2.5 text-forest transition hover:rotate-90 hover:bg-white sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-6 text-white">
            <p className="mb-1 text-xs font-bold text-white/80">
              {facility.type} · {facility.district}
            </p>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">
              {facility.name}
            </h2>
          </div>
        </div>

        <div className="space-y-8 px-4 py-6 sm:px-7 sm:py-7">
          <section>
            <h3 className="section-title">시설 정보</h3>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" />
                {facility.address || "정보 없음"}
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" />
                {facility.phone ?? "정보 없음"}
              </p>
              {facility.website && (
                <a
                  className="flex gap-3 text-accent-sky"
                  href={facility.website}
                >
                  <ExternalLink className="h-4 w-4" /> 홈페이지 보기
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {facility.amenities?.length ? (
                facility.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-lg bg-background-soft px-2.5 py-1.5 text-xs font-semibold text-text-secondary"
                  >
                    {amenity}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-secondary">정보 없음</span>
              )}
            </div>
            <p className="mt-4 text-xs text-text-secondary/65">
              운영정보 갱신일 {facility.updatedAt ?? "정보 없음"}
            </p>
          </section>

          <TransportAccessibility facility={facility} />

          <section className="border-t border-border pt-7">
            <h3 className="section-title">운영시간</h3>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted-surface px-4 py-3">
              <span className="text-xs font-semibold text-text-secondary">
                선택한 이용시간
              </span>
              <span className="text-sm font-bold text-accent-sky">
                {WEEKDAYS[filters.weekday]}요일 {filters.startTime}–
                {filters.endTime}
              </span>
            </div>
            {detail.loading ? (
              <div className="mt-4">
                <LoadingPanel />
              </div>
            ) : notFound ? (
              <div className="mt-4 rounded-xl border border-border bg-background-soft p-4 text-text-secondary">
                <div className="flex items-center gap-2 font-extrabold">
                  <AlertCircle className="h-5 w-5" />
                  시설 정보를 찾을 수 없어요
                </div>
                <p className="mt-1.5 pl-7 text-xs opacity-80">
                  목록에서 시설을 다시 선택해 주세요.
                </p>
              </div>
            ) : detail.error ? (
              <div className="mt-4">
                <ErrorPanel onRetry={detail.retry} />
              </div>
            ) : (
              <>
                {blocks.map((block) => {
                  const status = statusContent[block.kind]
                  const StatusIcon = status.icon
                  return (
                    <div
                      key={block.key}
                      className={`mt-4 rounded-xl border p-4 ${status.className}`}
                    >
                      <div className="flex items-center gap-2 font-extrabold">
                        <StatusIcon className="h-5 w-5" />
                        {block.label && `${block.label} · `}
                        {status.title}
                      </div>
                      <p className="mt-1.5 pl-7 text-xs opacity-80">
                        {status.description}
                        {block.note && ` (${block.note})`}
                      </p>
                    </div>
                  )
                })}
                {notices.map((notice) => (
                  <p
                    key={notice}
                    className="mt-3 text-[11px] leading-relaxed text-text-secondary/70"
                  >
                    {notice}
                  </p>
                ))}
                {blocks.map((block) => (
                  <div key={block.key}>
                    <h4 className="mt-6 text-sm font-extrabold text-forest">
                      요일별 운영시간{block.label && ` · ${block.label}`}
                    </h4>
                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      {WEEKDAYS.slice(1)
                        .concat(WEEKDAYS[0])
                        .map((day, index) => {
                          const value = index === 6 ? 0 : index + 1
                          const selected = filters.weekday === value
                          return (
                            <div
                              key={day}
                              className={`flex items-center justify-between gap-3 border-b border-border px-3 py-3 last:border-0 sm:px-4 ${
                                selected ? "bg-light-sky" : "bg-white"
                              }`}
                            >
                              <span
                                className={`text-sm font-bold ${
                                  selected
                                    ? "text-forest"
                                    : "text-text-secondary"
                                }`}
                              >
                                {day}요일
                                {selected && (
                                  <small className="ml-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">
                                    선택
                                  </small>
                                )}
                              </span>
                              <span
                                className={`text-right text-xs sm:text-sm ${
                                  block.weeklyHours[value]?.closed
                                    ? "text-error"
                                    : "text-text-primary"
                                }`}
                              >
                                {formatHours(block.weeklyHours[value])}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
                {facility.closedDayNote && (
                  <p className="mt-3 text-[11px] leading-relaxed text-text-secondary/70">
                    운영 참고: {facility.closedDayNote}
                  </p>
                )}
              </>
            )}
          </section>

          <AiRecommendation facility={facility} filters={filters} />
        </div>
      </aside>
    </div>
  )
}
