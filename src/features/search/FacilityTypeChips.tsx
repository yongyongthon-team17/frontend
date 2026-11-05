import { FACILITY_TYPES } from "../../constants/facility"
import type { SearchFilters } from "../../types/facility"

interface Props {
  value: SearchFilters["facilityType"]
  onChange: (value: SearchFilters["facilityType"]) => void
}

export function FacilityTypeChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FACILITY_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
            value === type
              ? "border-primary bg-light-sky text-text-primary"
              : "border-border bg-surface text-text-secondary hover:border-primary"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
