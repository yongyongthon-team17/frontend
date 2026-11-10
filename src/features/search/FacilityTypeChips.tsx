import type { FacilityTypeOption, SearchFilters } from "../../types/facility"

interface Props {
  /** A01 facilityTypes. 앞에 "전체" 칩이 붙는다 */
  options: FacilityTypeOption[]
  value: SearchFilters["facilityTypeId"]
  onChange: (value: SearchFilters["facilityTypeId"]) => void
}

export function FacilityTypeChips({ options, value, onChange }: Props) {
  const chips = [{ typeId: null, name: "전체" }, ...options]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((type) => (
        <button
          key={type.typeId ?? "all"}
          onClick={() => onChange(type.typeId)}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
            value === type.typeId
              ? "border-primary bg-light-sky text-text-primary"
              : "border-border bg-surface text-text-secondary hover:border-primary"
          }`}
        >
          {type.name}
        </button>
      ))}
    </div>
  )
}
