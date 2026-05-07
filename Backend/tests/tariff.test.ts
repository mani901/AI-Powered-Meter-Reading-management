import { calculateSlabBreakdown } from "../src/services/billing/tariff.service.js";

describe("Tariff slab math", () => {
  it("calculates slabs and totals deterministically", () => {
    const tariffs = [
      { minUnits: 1, maxUnits: 100, ratePerUnit: 10, fixedCharges: 150, fuelAdjustment: 3, taxPercentage: 17 },
      { minUnits: 101, maxUnits: 200, ratePerUnit: 20, fixedCharges: 150, fuelAdjustment: 3, taxPercentage: 17 },
      { minUnits: 201, maxUnits: null, ratePerUnit: 30, fixedCharges: 150, fuelAdjustment: 3, taxPercentage: 17 },
    ];

    const out = calculateSlabBreakdown(250, tariffs as any);
    expect(out.slabs.length).toBeGreaterThan(0);
    expect(out.energyCharges).toBe(100 * 10 + 100 * 20 + 50 * 30);
    expect(out.totalAmount).toBeGreaterThan(out.energyCharges);
  });
});

