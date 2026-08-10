import {
  FINAL_RANKINGS_WEEK,
  PRESEASON_WEEK,
  perPage,
  STATIC_NAV_ITEMS,
  TOP_25,
  WORDS_PER_MINUTE,
} from "@/lib/constants";

describe("constants", () => {
  it("exposes static nav destinations", () => {
    expect(STATIC_NAV_ITEMS).toEqual([
      { title: "About", href: "/about" },
      { title: "Contact Us", href: "/contact" },
    ]);
  });

  it("exposes ranking and pagination constants", () => {
    expect(perPage).toBe(12);
    expect(TOP_25).toBe(25);
    expect(WORDS_PER_MINUTE).toBe(200);
    expect(PRESEASON_WEEK).toBe(0);
    expect(FINAL_RANKINGS_WEEK).toBe(999);
  });
});
