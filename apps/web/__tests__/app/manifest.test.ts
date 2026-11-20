import { existsSync } from "node:fs";
import { join } from "node:path";

const { env } = vi.hoisted(() => ({
  env: { PORTAL_PUBLIC: undefined as string | undefined },
}));
vi.mock("@/env", () => ({ env }));

import manifest from "@/app/manifest";

const PUBLIC_DIR = join(__dirname, "../../public");

describe("manifest", () => {
  afterEach(() => {
    env.PORTAL_PUBLIC = undefined;
  });

  it("returns an installable web app manifest", () => {
    const result = manifest();

    expect(result.id).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
    expect(result.theme_color).toBe("#E80022");
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
  });

  it("falls back to the brand name when the app name isn't set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", undefined);
    expect(manifest().name).toBe("Redshirt Sports");
    vi.unstubAllEnvs();
  });

  it("has any and maskable icons at 192 and 512", () => {
    const icons = manifest().icons ?? [];
    for (const purpose of ["any", "maskable"]) {
      const sizes = icons
        .filter((icon) => icon.purpose === purpose)
        .map((icon) => icon.sizes);
      expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    }
  });

  it("has wide and narrow screenshots for the install dialog", () => {
    const forms = (manifest().screenshots ?? []).map((s) => s.form_factor);
    expect(forms).toContain("wide");
    expect(forms).toContain("narrow");
  });

  it("points only at files that exist in public/", () => {
    const result = manifest();
    const paths = [
      ...(result.icons ?? []),
      ...(result.screenshots ?? []),
      ...(result.shortcuts ?? []).flatMap((s) => s.icons ?? []),
    ].map((asset) => asset.src);
    for (const src of paths) {
      expect(existsSync(join(PUBLIC_DIR, src)), src).toBe(true);
    }
  });

  it("offers the transfer portal shortcut only once the portal is public", () => {
    const urls = () => (manifest().shortcuts ?? []).map((s) => s.url);
    expect(urls()).not.toContain("/transfer-portal");
    env.PORTAL_PUBLIC = "true";
    expect(urls()).toContain("/transfer-portal");
  });
});
