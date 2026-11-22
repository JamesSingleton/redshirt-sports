import { Img, Text } from "react-email";

export type EmailLogo = { src: string; width: number; height: number };

/** The wordmark, or the name in text when there's no logo to show. */
export function Wordmark({
  logo,
  textClassName,
}: {
  logo: EmailLogo | null;
  textClassName: string;
}) {
  return logo ? (
    <Img
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt="Redshirt Sports"
    />
  ) : (
    <Text
      className={`m-0 text-[13px] font-bold tracking-[2px] uppercase ${textClassName}`}
    >
      Redshirt Sports
    </Text>
  );
}

/** Preview server only: the live footer wordmarks, as PNG. */
const PREVIEW_LOGO = (id: string): EmailLogo => ({
  src: `https://cdn.sanity.io/images/8pbt9f8w/production/${id}-2931x485.svg?h=56&fit=max&fm=png`,
  width: 169,
  height: 28,
});
export const PREVIEW_LOGO_ON_LIGHT = PREVIEW_LOGO(
  "0fb1b413878e0f29d10721fbbb5a5fbe95072d45",
);
export const PREVIEW_LOGO_ON_DARK = PREVIEW_LOGO(
  "14baf184e4e1f99f2e8fd0e8029ac5f58201912c",
);
