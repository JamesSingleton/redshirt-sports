import { stripSchoolLogoImage } from "@redshirt-sports/db/queries";

describe("stripSchoolLogoImage", () => {
  it("returns null for nullish values", () => {
    expect(stripSchoolLogoImage(null)).toBeNull();
    expect(stripSchoolLogoImage(undefined)).toBeNull();
  });

  it("drops preview, lqip, and dominantColor from logo objects", () => {
    expect(
      stripSchoolLogoImage({
        id: "image-abc",
        alt: "Montana",
        preview: "data:image/png;base64,aaaa",
        lqip: "data:image/png;base64,bbbb",
        dominantColor: "#003",
        width: 512,
        height: 512,
      }),
    ).toEqual({
      id: "image-abc",
      alt: "Montana",
      width: 512,
      height: 512,
    });
  });

  it("passes through non-objects", () => {
    expect(stripSchoolLogoImage("https://cdn.example/logo.png")).toBe(
      "https://cdn.example/logo.png",
    );
  });
});
