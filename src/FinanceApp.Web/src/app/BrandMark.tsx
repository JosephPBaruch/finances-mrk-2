import "./BrandMark.scss";

export function BrandMark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div className={`brand-mark ${inverse ? "brand-mark--inverse" : ""}`} aria-label="Finances">
      <svg className="brand-mark__icon" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <rect width="48" height="48" rx="13" fill="#C48A4A" />
        <rect x="10" y="29" width="5" height="9" rx="2.5" fill="#123B31" />
        <rect x="18" y="23" width="5" height="15" rx="2.5" fill="#123B31" />
        <rect x="26" y="17" width="5" height="21" rx="2.5" fill="#123B31" />
        <rect x="34" y="10" width="5" height="28" rx="2.5" fill="#123B31" />
      </svg>
      {!compact && <span className="brand-mark__wordmark">Finances</span>}
    </div>
  );
}
