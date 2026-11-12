import type { SpaceAvailabilityStatus } from "../../types/facility"

/** 시설 이용 상태 → 뱃지 문구·색 (A02 availabilityStatus). 마커 색도 여기서 정한다 */
export const AVAILABILITY_BADGE: Record<
  SpaceAvailabilityStatus,
  { label: string; className: string; markerClassName: string }
> = {
  AVAILABLE: {
    label: "이용 가능",
    className: "bg-success-light text-success",
    markerClassName: "bg-main-sky",
  },
  UNAVAILABLE: {
    label: "이용 불가",
    className: "bg-error-light text-error",
    markerClassName: "bg-error",
  },
  UNKNOWN: {
    label: "확인 필요",
    className: "bg-caution-light text-caution",
    markerClassName: "bg-caution-marker",
  },
}

interface Props {
  status: SpaceAvailabilityStatus
  /** 카드 이미지 위 큰 뱃지(기본) 또는 목록의 작은 뱃지 */
  size?: "md" | "sm"
}

export function AvailabilityBadge({ status, size = "md" }: Props) {
  const { label, className } = AVAILABILITY_BADGE[status]
  const sizeClass =
    size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2 py-1 text-[10px]"
  return (
    <span
      className={`inline-block shrink-0 rounded-full font-extrabold ${sizeClass} ${className}`}
    >
      {label}
    </span>
  )
}
