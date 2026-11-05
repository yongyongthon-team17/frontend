import type { AppScreen } from "../../types/navigation"
import { Logo } from "./Logo"

interface Props {
  active: AppScreen
  onNavigate: (screen: AppScreen) => void
}

const MENU_ITEMS = [
  { value: "home", label: "홈" },
  { value: "search", label: "시설 찾기" },
  { value: "map", label: "지도 보기" },
] as const

export function Header({ active, onNavigate }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Logo onClick={() => onNavigate("home")} />
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="주요 탐색"
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => onNavigate(item.value)}
              className={`relative flex h-16 items-center text-sm font-semibold transition ${
                active === item.value
                  ? "text-forest after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-text-secondary hover:text-forest"
              }`}
              aria-current={active === item.value ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
