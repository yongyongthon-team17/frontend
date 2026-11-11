/**
 * A05 교통 접근성 타입.
 * GET /api/v1/facilities/{facilityId}/transport-accessibility
 */

export interface TransportAccessibilityDto {
  facilityId: string
  accessibility: {
    status: string
    radiusMeters: number
    stopCount: number | null
    grade: string | null
    notes?: string[]
  }
}

export interface TransportSummary {
  status: string
  available: boolean
  radiusMeters: number
  stopCount: number | null
  grade: string | null
  notes: string[]
}