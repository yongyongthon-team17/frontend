import { Home, Map, Search } from "lucide-react"

type AppScreen = "home" | "search" | "map"

interface Props {
  active: AppScreen
  onNavigate: (screen: AppScreen) => void
}

const ITEMS = [
  { value: "home", label: "홈", icon: Home },
  { value: "search", label: "시설 찾기", icon: Search },
  { value: "map", label: "지도 보기", icon: Map },
] as const

export function MobileBottomNav({ active, onNavigate }: Props) {
  return (
    <nav
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-white p-1.5 md:hidden"
      aria-label="모바일 주요 탐색"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon
        const selected = active === item.value
        return (
          <button
            key={item.value}
            onClick={() => onNavigate(item.value)}
            className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition ${
              selected
                ? "bg-light-sky text-forest"
                : "text-text-secondary hover:bg-muted-surface"
            }`}
            aria-current={selected ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
