import { pixelBasedPreset, type TailwindConfig } from "react-email";

/** The site's tokens as hex: email clients don't read oklch or CSS variables. */
export const emailTailwind: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: "#b3261e",
        ink: "#15181d",
        muted: "#5b6270",
        rule: "#e4e6ea",
        paper: "#f4f5f7",
      },
    },
  },
};
