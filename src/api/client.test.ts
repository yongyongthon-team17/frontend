import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiGet, isAbortError } from "./client"

/** signal이 중단될 때까지 응답하지 않는 fetch */
const hangingFetch = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(new DOMException("Aborted", "AbortError")),
    )
  })

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("apiGet 타임아웃", () => {
  it("타임아웃은 ApiError(TIMEOUT), 사용자 취소는 AbortError로 구분한다", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn(hangingFetch))

    // 1) 타임아웃
    const timedOut = apiGet("/api/v1/facilities", undefined, { timeoutMs: 100 })
    const timeoutAssertion = expect(timedOut).rejects.toMatchObject({
      name: "ApiError",
      code: "TIMEOUT",
    })
    await vi.advanceTimersByTimeAsync(100)
    await timeoutAssertion
    await expect(timedOut).rejects.toBeInstanceOf(ApiError)

    // 2) 타임아웃 전에 호출 측이 취소
    const controller = new AbortController()
    const canceled = apiGet("/api/v1/facilities", undefined, {
      signal: controller.signal,
      timeoutMs: 100,
    })
    const cancelResult = canceled.catch((error: unknown) => error)
    controller.abort()
    const error = await cancelResult
    expect(isAbortError(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})
