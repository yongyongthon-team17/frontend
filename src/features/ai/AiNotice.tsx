import { AlertTriangle, Clock3 } from "lucide-react"
import type { ReactNode } from "react"

interface Props {
  /** warning: 한도 초과처럼 잠시 후 다시 시도하면 되는 안내, error: 호출 실패 */
  tone: "warning" | "error"
  title: string
  children?: ReactNode
}

/** AI 카드 안에서 쓰는 작은 안내 박스(한도 초과·생성 실패·호출 오류) */
export function AiNotice({ tone, title, children }: Props) {
  const Icon = tone === "warning" ? Clock3 : AlertTriangle
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl p-4 ${
        tone === "warning" ? "bg-warning-light" : "bg-error-light"
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          tone === "warning" ? "text-warning" : "text-error"
        }`}
      />
      <div>
        <p className="text-sm font-extrabold text-forest">{title}</p>
        {children && (
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {children}
          </p>
        )}
      </div>
    </div>
  )
}
