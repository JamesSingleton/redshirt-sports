import { scaleGuide } from "@/lib/ratings/scale";

const row = (
  power: number,
  sos: number | null,
  sorRank: number | null,
  sor: number | null,
) => ({
  power,
  sos,
  sorRank,
  sor,
});

describe("scaleGuide", () => {
  it("finds the best, 10th, middle, and easiest values", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      row(30 - i, i / 100, i + 1, i / 100),
    );
    const guide = scaleGuide(rows);
    expect(guide.power).toEqual({ best: 30, tenth: 21, middle: 15.5 });
    expect(guide.sos.hardest).toBe(0.29);
    expect(guide.sos.tenth).toBe(0.2);
    expect(guide.sos.middle).toBeCloseTo(0.145, 12);
    expect(guide.sos.easiest).toBe(0);
    expect(guide.sor).toEqual({ best: 0, twentyFifth: 0.24 });
  });

  it("handles short and empty tables", () => {
    const short = scaleGuide([
      row(5, null, null, null),
      row(1, 0.3, 1, 0.2),
      row(3, 0.1, 2, 0.4),
    ]);
    expect(short.power).toEqual({ best: 5, tenth: 1, middle: 3 });
    expect(short.sos).toEqual({
      hardest: 0.3,
      tenth: 0.1,
      middle: 0.2,
      easiest: 0.1,
    });
    expect(short.sor).toEqual({ best: 0.2, twentyFifth: null });
    const empty = scaleGuide([]);
    expect(empty.power).toEqual({ best: null, tenth: null, middle: null });
    expect(empty.sos.easiest).toBeNull();
  });
});
