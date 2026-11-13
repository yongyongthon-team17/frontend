import { useEffect, useState } from "react"

/** SDK 스크립트가 끝내 준비되지 않으면 fallback으로 넘어가는 시간 */
const LOAD_TIMEOUT_MS = 10_000

let loading: Promise<typeof kakao> | null = null

const kakaoKey = () => import.meta.env.VITE_KAKAO_JS_KEY?.trim() ?? ""

export const hasKakaoKey = () => kakaoKey() !== ""

/**
 * 카카오맵 SDK를 한 번만 동적으로 불러온다(autoload=false + kakao.maps.load).
 * 키 없음 · 스크립트 오류 · 시간 초과 · 미등록 도메인(kakao.maps 없음)이면 reject.
 * 실패한 결과도 그대로 캐시한다(새로고침 전까지 fallback 유지).
 */
export function loadKakaoMaps(): Promise<typeof kakao> {
  if (loading) return loading

  loading = new Promise<typeof kakao>((resolve, reject) => {
    const key = kakaoKey()
    if (!key) {
      reject(new Error("VITE_KAKAO_JS_KEY가 비어 있습니다"))
      return
    }
    if (window.kakao?.maps?.LatLng) {
      resolve(window.kakao)
      return
    }

    const script = document.createElement("script")
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=clusterer`

    const fail = (message: string) => {
      clearTimeout(timer)
      script.remove()
      reject(new Error(message))
    }
    const timer = setTimeout(
      () => fail("카카오맵 SDK 로드 시간 초과"),
      LOAD_TIMEOUT_MS,
    )

    script.onerror = () => fail("카카오맵 SDK 스크립트를 불러오지 못했습니다")
    script.onload = () => {
      const sdk = window.kakao
      if (!sdk?.maps?.load) {
        fail("카카오맵 SDK가 초기화되지 않았습니다(키·도메인 확인)")
        return
      }
      sdk.maps.load(() => {
        clearTimeout(timer)
        if (sdk.maps.MarkerClusterer) resolve(sdk)
        else reject(new Error("카카오맵 클러스터러 라이브러리가 없습니다"))
      })
    }

    document.head.appendChild(script)
  })

  return loading
}

export type KakaoStatus = "loading" | "ready" | "failed"

/** 지도 화면에서 SDK 준비 상태를 구독한다. 키가 없으면 곧바로 failed */
export function useKakaoMaps(): KakaoStatus {
  const [status, setStatus] = useState<KakaoStatus>(() =>
    hasKakaoKey() ? "loading" : "failed",
  )

  useEffect(() => {
    if (!hasKakaoKey()) return
    let active = true
    loadKakaoMaps().then(
      () => active && setStatus("ready"),
      (error: unknown) => {
        console.warn("[kakao-map] fallback 지도로 표시합니다:", error)
        if (active) setStatus("failed")
      },
    )
    return () => {
      active = false
    }
  }, [])

  return status
}
