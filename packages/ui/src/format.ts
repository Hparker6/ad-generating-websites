/**
 * Formats a currency amount to cents. Values smaller than a cent but not
 * zero are shown with extra precision instead of collapsing to "$0.00",
 * which would misrepresent a real (if tiny) per-unit margin.
 */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  const decimals = magnitude > 0 && magnitude < 0.01 ? 4 : 2;
  const absolute = magnitude.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}$${absolute}`;
}

/** Takes a fraction (0.4) and renders a percentage ("40.0%"). */
export function formatPercent(fraction: number, decimals: number = 1): string {
  return formatPercentValue(fraction * 100, decimals);
}

/** Takes a value already expressed as a percent (40, not 0.4). */
export function formatPercentValue(percent: number, decimals: number = 1): string {
  return `${percent.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Short form for chart axis labels, where a full "$1,250,000.00" would
 * overflow the gutter: "$1.3M", "$19K", "$950".
 */
export function formatCompactCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
}

/** Short form for large counts on chart axes: "1.2M", "19K", "728". */
export function formatCompactNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
