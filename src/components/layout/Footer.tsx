export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-2 px-4 py-7 text-xs text-text-secondary/65 sm:flex-row sm:items-center sm:px-6">
        <p>
          <strong className="mr-2 text-forest">지금가용</strong>
          운영정보는 실제 예약 가능 여부와 다를 수 있습니다.
        </p>
        <p>Hackathon MVP · Demo data only</p>
      </div>
    </footer>
  )
}
