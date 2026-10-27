// The MATRIX mark as SVG, matched to the club's official logo (white pieces, red bars).
export default function Mark({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg className={`${className ?? ""} ${animate ? "draw" : ""}`} viewBox="140 144 488 514" role="img" aria-label="MATRIX">
      <g className="mark-white" fill="currentColor">
        <path d="M148 152 L617 575 L617 650 L148 222 Z" />
        <path d="M148 252 L305 382 L265 415 L205 360 L205 470 L148 515 Z" />
        <path d="M620 252 L463 382 L503 415 L563 360 L563 485 L620 530 Z" />
      </g>
      <g className="mark-bars" fill="var(--red)">
        <path d="M398 326 L617 152 L619 226 L432 362 Z" />
        <path d="M148 538 L324 402 L357 433 L148 604 Z" />
      </g>
    </svg>
  );
}
