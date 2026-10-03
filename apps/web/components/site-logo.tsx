import { cn } from "@redshirt-sports/ui/lib/utils";

import CustomImage from "./sanity-image";

type LogoImage = Parameters<typeof CustomImage>[0]["image"];

const BRAND_NAME = "Redshirt Sports";

/** Renders the light logo in light mode and the dark-mode logo in dark mode. */
export function SiteLogo({
  light,
  dark,
  priority = false,
  className,
}: {
  light?: LogoImage | null;
  dark?: LogoImage | null;
  priority?: boolean;
  className?: string;
}) {
  if (!light && !dark) {
    return <span className="headline text-xl">{BRAND_NAME}</span>;
  }

  const lightLogo = light ?? dark;
  const darkLogo = dark ?? light;

  return (
    <>
      {lightLogo ? (
        <CustomImage
          image={lightLogo}
          width={180}
          height={30}
          priority={priority}
          quality={100}
          className={cn("w-auto dark:hidden", className)}
        />
      ) : null}
      {darkLogo ? (
        <CustomImage
          image={darkLogo}
          width={180}
          height={30}
          priority={priority}
          quality={100}
          className={cn("hidden w-auto dark:block", className)}
        />
      ) : null}
    </>
  );
}
