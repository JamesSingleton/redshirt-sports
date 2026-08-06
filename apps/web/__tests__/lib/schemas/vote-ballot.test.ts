import { top25FormSchema, voteRequestSchema } from "@/lib/schemas/vote-ballot";

function fullBallot(overrides: Record<string, string> = {}) {
  const ranks: Record<string, string> = {};
  for (let i = 1; i <= 25; i++) {
    ranks[`rank_${i}`] = `school-${i}`;
  }
  return {
    sport: "football",
    division: "fbs" as const,
    ...ranks,
    ...overrides,
  };
}

describe("voteRequestSchema / top25FormSchema", () => {
  it("are the same schema (all 25 ranks required)", () => {
    expect(voteRequestSchema).toBe(top25FormSchema);
  });

  it("requires all 25 ranks", () => {
    const result = voteRequestSchema.safeParse({
      sport: "football",
      division: "fbs",
      rank_1: "a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid divisions", () => {
    expect(() =>
      voteRequestSchema.parse({ ...fullBallot(), division: "d1" }),
    ).toThrow();
  });

  it("accepts a complete unique ballot", () => {
    expect(voteRequestSchema.safeParse(fullBallot()).success).toBe(true);
  });

  it("rejects duplicate teams", () => {
    const result = voteRequestSchema.safeParse(
      fullBallot({ rank_2: "school-1" }),
    );
    expect(result.success).toBe(false);
  });
});
