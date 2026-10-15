import { describe, expect, it } from "vitest";

import { isDesignRouteEnabled } from "@/lib/design-route";

describe("isDesignRouteEnabled", () => {
  it("is available outside production", () => {
    expect(isDesignRouteEnabled("development")).toBe(true);
    expect(isDesignRouteEnabled("test")).toBe(true);
  });

  it("is hidden in production", () => {
    expect(isDesignRouteEnabled("production")).toBe(false);
  });
});
