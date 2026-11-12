import { ArrowRight, Clock3, MapPin } from "lucide-react"
import type { SyntheticEvent } from "react"
import { FALLBACK_IMAGE_URL } from "../../api/mappers"
import { AvailabilityBadge } from "../../components/common/AvailabilityBadge"
import type { FacilitySummary } from "../../types/facility"
import { formatSpaceHours } from "../../utils/timeUtils"

interface Props {
  facility: FacilitySummary
  onClick: () => void
}

/** 이미지 로드 실패 시 공통 대체 이미지로, 그것도 실패하면 숨긴다(배경색만 표시) */
function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.dataset.fallback === "true") {
    image.style.visibility = "hidden"
    return
  }
  image.dataset.fallback = "true"
  image.src = FALLBACK_IMAGE_URL
}

export function FacilityCard({ facility, onClick }: Props) {
  return (
    <article
      className="group flex min-h-[380px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-primary"
      onClick={onClick}
    >
      <div className="relative h-[180px] overflow-hidden bg-primary-light">
        <img
          src={facility.imageUrl}
          alt=""
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3">
          <AvailabilityBadge status={facility.availabilityStatus} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-accent-sky">
                {facility.typeName}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="text-xs text-text-secondary">
                {facility.district}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-forest">
              {facility.name}
            </h3>
          </div>
        </div>
        <p className="flex items-start gap-2 text-sm leading-5 text-text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" />
          {facility.address}
        </p>
        <div className="mt-4 rounded-xl bg-background-soft px-3 py-2.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Clock3 className="h-4 w-4 text-accent-sky" />
            {formatSpaceHours(facility.availableSpaces)}
          </p>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
          className="mt-auto flex items-center justify-between pt-4 text-sm font-extrabold text-forest transition group-hover:text-accent-sky"
        >
          시설 상세 보기 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
