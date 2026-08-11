import type { VoterBallotSchoolEntry } from "@redshirt-sports/db/queries";
import { urlFor } from "@redshirt-sports/sanity/client";
import type { SanityImageSource } from "@sanity/image-url";

import { ballotShareHeadline } from "@/lib/ballot-share-labels";

export const BALLOT_SHARE_WIDTH = 1080;
export const BALLOT_SHARE_HEIGHT = 1350;

const LOGO_URL =
  "https://cdn.sanity.io/images/8pbt9f8w/production/6ed24cde242b41912e2d06bf2ca7da9abdf97c06-4347x2855.svg";

const BRAND_RED = "#E80022";
const BG = "#0a0a0a";
const CARD_BG = "#141414";
const TEXT = "#fafafa";
const MUTED = "#a1a1aa";

export type BallotShareImageProps = {
  entries: VoterBallotSchoolEntry[];
  division: string;
  week: number;
  voterName: string;
  organization: string | null;
};

export function schoolLogoUrl(image: unknown): string | null {
  if (image == null) return null;
  if (typeof image === "string") {
    return image.length > 0 ? image : null;
  }
  try {
    return urlFor(image as SanityImageSource)
      .width(128)
      .height(128)
      .url();
  } catch {
    return null;
  }
}

function displayName(entry: VoterBallotSchoolEntry): string {
  return entry.shortName ?? entry.abbreviation ?? entry.name ?? "Team";
}

function abbreviation(entry: VoterBallotSchoolEntry): string {
  return (entry.abbreviation ?? entry.shortName ?? entry.name ?? "?").slice(
    0,
    4,
  );
}

/** JSX tree for `ImageResponse` — keep styles as plain objects (no Tailwind). */
export function BallotShareImage({
  entries,
  division,
  week,
  voterName,
  organization,
}: BallotShareImageProps) {
  const headline = ballotShareHeadline({ division, week });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG,
        color: TEXT,
        padding: 48,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img
            src={LOGO_URL}
            width={72}
            height={37}
            alt=""
            style={{ objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Redshirt Sports
          </span>
        </div>
        <div
          style={{
            display: "flex",
            backgroundColor: BRAND_RED,
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Top 25 Ballot
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          {headline}
        </span>
        <span
          style={{
            marginTop: 10,
            fontSize: 24,
            color: MUTED,
          }}
        >
          {voterName}
          {organization ? ` · ${organization}` : ""}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          flex: 1,
          alignContent: "flex-start",
        }}
      >
        {entries.map((entry) => {
          const logoUrl = schoolLogoUrl(entry.image);
          const name = displayName(entry);
          return (
            <div
              key={`${entry.rank}-${entry.schoolId}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 188,
                backgroundColor: CARD_BG,
                borderRadius: 16,
                padding: "14px 10px 12px",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: BRAND_RED,
                  marginBottom: 8,
                }}
              >
                #{entry.rank}
              </span>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  width={56}
                  height={56}
                  alt=""
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: BRAND_RED,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {abbreviation(entry)}
                </div>
              )}
              <span
                style={{
                  marginTop: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: 168,
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 20,
          fontSize: 20,
          color: MUTED,
          letterSpacing: "0.04em",
        }}
      >
        redshirtsports.com
      </div>
    </div>
  );
}
