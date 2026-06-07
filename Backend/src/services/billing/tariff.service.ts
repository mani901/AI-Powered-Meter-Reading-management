import { prisma } from "../../lib/prisma.js";

export type SlabLine = { slab: string; units: number; rate: number; amount: number };

export async function getActiveResidentialTariffs() {
  const rows = await prisma.tariff.findMany({
    where: { isActive: true },
    orderBy: { minUnits: "asc" },
  });

  // Heuristic: if the dataset includes both residential & commercial, keep residential first.
  const residential = rows.filter((t) => t.name.toLowerCase().includes("residential"));
  return (residential.length ? residential : rows).sort((a, b) => a.minUnits - b.minUnits);
}

type TariffLike = {
  minUnits: number;
  maxUnits: number | null;
  ratePerUnit: unknown;
  fixedCharges: unknown;
  fuelAdjustment: unknown;
  taxPercentage: unknown;
};

export function calculateSlabBreakdown(units: number, tariffs: TariffLike[]) {
  const slabs: SlabLine[] = [];
  let remaining = Math.max(0, Math.floor(units));
  let energyCharges = 0;

  const sorted = [...tariffs].sort((a, b) => a.minUnits - b.minUnits);

  for (const t of sorted) {
    if (remaining <= 0) break;
    const maxUnits = t.maxUnits ?? null;
    const capacity = maxUnits ? maxUnits - t.minUnits + 1 : remaining;
    const u = Math.min(remaining, capacity);
    const rate = Number(t.ratePerUnit);
    const amount = u * rate;
    slabs.push({ slab: maxUnits ? `${t.minUnits}-${maxUnits}` : `${t.minUnits}+`, units: u, rate, amount });
    energyCharges += amount;
    remaining -= u;
  }

  const fixedCharges = Number(sorted[0]?.fixedCharges ?? 150);
  const fuelAdjRate = Number(sorted[0]?.fuelAdjustment ?? 3.23);
  const taxPct = Number(sorted[0]?.taxPercentage ?? 17) / 100;

  const fuelAdjustment = units * fuelAdjRate;
  const subtotal = energyCharges + fixedCharges + fuelAdjustment;
  const taxAmount = subtotal * taxPct;
  const totalAmount = subtotal + taxAmount;

  return { slabs, energyCharges, fixedCharges, fuelAdjustment, taxAmount, totalAmount };
}

