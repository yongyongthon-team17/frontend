const STORAGE_KEY = "jigeumgayong-client-id"

let memoryId: string | null = null

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // randomUUID가 없는 환경(비보안 컨텍스트 등)용 RFC 4122 v4 형식 대체
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * 브라우저별 익명 클라이언트 ID(X-Client-Id용, A04에서 사용 예정).
 * localStorage에 한 번 만들어 두고 재사용한다. 저장소를 못 쓰면 탭 메모리 값을 쓴다.
 */
export function getClientId(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    const id = createId()
    window.localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    memoryId ??= createId()
    return memoryId
  }
}
