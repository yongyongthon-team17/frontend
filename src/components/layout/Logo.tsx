interface Props {
  onClick?: () => void
}

export function Logo({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center transition hover:opacity-85"
      aria-label="지금가용 검색으로 이동"
    >
      <img
        src="/jigeumgayong-logo.png"
        alt="지금가용"
        className="h-8 w-auto object-contain"
      />
    </button>
  )
}
