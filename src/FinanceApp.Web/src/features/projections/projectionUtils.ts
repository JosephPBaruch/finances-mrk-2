export type ProjectionPoint = { year: number; label: string; nominal: number; real: number };

export function projectWealth(
  startingBalance: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  inflationPercent: number,
  years: number,
): ProjectionPoint[] {
  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  const points: ProjectionPoint[] = [];
  let balance = startingBalance;
  for (let month = 0; month <= years * 12; month += 1) {
    if (month % 12 === 0) {
      const year = month / 12;
      points.push({
        year,
        label: year === 0 ? "Now" : `Year ${year}`,
        nominal: Math.round(balance),
        real: Math.round(balance / Math.pow(1 + inflationPercent / 100, year)),
      });
    }
    if (month < years * 12) balance = balance * (1 + monthlyRate) + monthlyContribution;
  }
  return points;
}

export function targetYear(points: ProjectionPoint[], target: number): number | null {
  return points.find((point) => point.nominal >= target)?.year ?? null;
}
