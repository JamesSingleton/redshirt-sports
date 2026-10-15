import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function oklchToSrgb(L: number, C: number, H: number) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((channel) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  });
}

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((channel) => {
    const value = Math.min(1, Math.max(0, channel));
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: number[], b: number[]) {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function token(block: string, name: string) {
  const match = block.match(
    new RegExp(`${name}:\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\)`),
  );
  if (!match) throw new Error(`missing ${name}`);
  return oklchToSrgb(Number(match[1]), Number(match[2]), Number(match[3]));
}

describe("theme contrast", () => {
  const css = readFileSync(resolve(import.meta.dirname, "globals.css"), "utf8");
  const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  const dark = css.match(/\.dark\s*\{([^}]*)\}/)?.[1] ?? "";

  it("keeps primary text at least 4.5:1 in light and dark", () => {
    expect(
      contrast(token(root, "--primary"), token(root, "--primary-foreground")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token(dark, "--primary"), token(dark, "--primary-foreground")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the ink bar at least 4.5:1", () => {
    expect(
      contrast(token(root, "--ink"), token(root, "--ink-foreground")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("does not put hex colors in the token file", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
