import manifest from "@/app/manifest";

describe("manifest", () => {
  it("returns a valid web app manifest", () => {
    const result = manifest();

    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
    expect(result.theme_color).toBe("#E80022");
    expect(result.background_color).toBe("#FAFBFF");
    expect(result.icons?.length).toBeGreaterThan(0);
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
  });
});
