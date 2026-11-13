import type { SyntheticEvent } from "react"
import { FALLBACK_IMAGE_URL, getTypeImageUrl } from "../api/mappers"

/** 실패한 이미지를 대신할 순서: 유형별 기본 이미지 → 공통 대체 이미지 */
export function getImageFallbacks(typeName: string): string[] {
  return [...new Set([getTypeImageUrl(typeName), FALLBACK_IMAGE_URL])]
}

/**
 * 시설 이미지 로드 실패 시 유형별 기본 이미지 → 공통 대체 이미지로 차례로 바꾸고,
 * 모두 실패하면 숨긴다(배경색만 표시). 지금 실패한 주소와 같은 대체 이미지는 건너뛴다.
 * 다른 시설로 바뀔 때 상태가 남지 않도록 img에 key를 시설 id로 준다.
 */
export function handleFacilityImageError(
  event: SyntheticEvent<HTMLImageElement>,
  typeName: string,
) {
  const image = event.currentTarget
  const fallbacks = getImageFallbacks(typeName)
  const failed = image.getAttribute("src") ?? ""
  for (let step = Number(image.dataset.fallbackStep ?? 0); step < fallbacks.length; step++) {
    if (fallbacks[step] === failed) continue
    image.dataset.fallbackStep = String(step + 1)
    image.src = fallbacks[step]
    return
  }
  image.style.visibility = "hidden"
}
