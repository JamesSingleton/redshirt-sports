"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { shadcn } from "@clerk/ui/themes";
import type { Theme } from "@clerk/ui/internal";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

type AuthProviderProperties = ComponentProps<typeof ClerkProvider> & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
};

const DARK_MODE_LOGO_URL =
  "https://cdn.sanity.io/images/8pbt9f8w/production/14baf184e4e1f99f2e8fd0e8029ac5f58201912c-2931x485.svg";
const LIGHT_MODE_LOGO_URL =
  "https://cdn.sanity.io/images/8pbt9f8w/production/0fb1b413878e0f29d10721fbbb5a5fbe95072d45-2931x485.svg";

export const AuthProvider = ({
  privacyUrl,
  termsUrl,
  helpUrl,
  ...properties
}: AuthProviderProperties) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const baseTheme = isDark ? dark : undefined;

  const variables: Theme["variables"] = {
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
    fontWeight: {
      bold: "var(--font-weight-bold)",
      normal: "var(--font-weight-normal)",
      medium: "var(--font-weight-medium)",
    },
  };

  const elements: Theme["elements"] = {
    dividerLine: "bg-border",
    socialButtonsIconButton: "bg-card",
    navbarButton: "text-foreground",
    organizationSwitcherTrigger__open: "bg-background",
    organizationPreviewMainIdentifier: "text-foreground",
    organizationSwitcherTriggerIcon: "text-muted-foreground",
    organizationPreview__organizationSwitcherTrigger: "gap-2",
    organizationPreviewAvatarContainer: "shrink-0",
  };

  const options: Theme["options"] = {
    privacyPageUrl: privacyUrl,
    termsPageUrl: termsUrl,
    helpPageUrl: helpUrl,
    logoImageUrl: isDark ? DARK_MODE_LOGO_URL : LIGHT_MODE_LOGO_URL,
  };

  return (
    <ClerkProvider
      {...properties}
      appearance={{
        options,
        theme: shadcn,
        elements,
        variables,
      }}
    />
  );
};
