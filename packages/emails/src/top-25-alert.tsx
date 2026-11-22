import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { type EmailLogo, PREVIEW_LOGO_ON_DARK, Wordmark } from "./logo";
import { emailTailwind } from "./theme";

export type AlertMovement =
  | { kind: "up" | "down"; delta: number }
  | { kind: "same" }
  | { kind: "new" };

export type AlertTeam = {
  id: string;
  rank: number;
  isTie: boolean;
  name: string;
  points: number;
  firstPlaceVotes: number;
  movement: AlertMovement;
};

export type Top25AlertEmailProps = {
  /** "FCS Top 25" */
  pollName: string;
  /** "Week 11" */
  weekLabel: string;
  year: number;
  pollUrl: string;
  ballotsUrl: string;
  siteUrl: string;
  teams: AlertTeam[];
  /** "Montana 41, Idaho 12": teams outside the 25 with points. */
  othersReceivingVotes: string;
  unsubscribeUrl: string;
  logo: EmailLogo | null;
};

function MovementCell({ movement }: { movement: AlertMovement }) {
  switch (movement.kind) {
    case "up":
      return <span className="text-[#1f7a3d]">{`▲${movement.delta}`}</span>;
    case "down":
      return <span className="text-brand">{`▼${movement.delta}`}</span>;
    case "new":
      return <span className="font-bold text-ink">NEW</span>;
    default:
      return <span className="text-muted">–</span>;
  }
}

function TeamRow({ team }: { team: AlertTeam }) {
  return (
    <Row className="border-none border-t border-solid border-rule">
      <Column className="w-[44px] py-[9px] text-[15px] font-bold text-ink">
        {team.isTie ? `T-${team.rank}` : team.rank}
      </Column>
      <Column className="py-[9px] text-[15px] text-ink">
        {team.name}
        {team.firstPlaceVotes > 0 ? (
          <span className="text-muted"> ({team.firstPlaceVotes})</span>
        ) : null}
      </Column>
      <Column className="w-[64px] py-[9px] text-right text-[13px] text-muted">
        {team.points}
      </Column>
      <Column className="w-[52px] py-[9px] text-right text-[12px]">
        <MovementCell movement={team.movement} />
      </Column>
    </Row>
  );
}

export default function Top25AlertEmail({
  pollName,
  weekLabel,
  year,
  pollUrl,
  ballotsUrl,
  siteUrl,
  teams,
  othersReceivingVotes,
  unsubscribeUrl,
  logo,
}: Top25AlertEmailProps) {
  const leader = teams[0];
  return (
    <Html lang="en">
      <Tailwind config={emailTailwind}>
        <Head />
        <Body className="bg-paper m-0 py-8 font-sans">
          <Preview>
            {leader
              ? `${leader.name} is No. 1 in the ${year} ${pollName}, ${weekLabel}`
              : `The ${year} ${pollName}, ${weekLabel}`}
          </Preview>
          <Container className="max-w-[600px] bg-white">
            <Section className="bg-ink px-8 py-6">
              <Wordmark logo={logo} textClassName="text-white" />
              <Heading
                as="h1"
                className="mt-3 mb-0 text-[28px] leading-[34px] text-white"
              >
                {pollName}
              </Heading>
              <Text className="mt-1 mb-0 text-[14px] text-[#c9ccd3]">
                {year} · {weekLabel}
              </Text>
            </Section>
            <Section className="px-8 pt-6">
              <Row>
                <Column className="w-[44px] text-[11px] font-bold tracking-[1px] text-muted uppercase">
                  Rk
                </Column>
                <Column className="text-[11px] font-bold tracking-[1px] text-muted uppercase">
                  Team (1st)
                </Column>
                <Column className="w-[64px] text-right text-[11px] font-bold tracking-[1px] text-muted uppercase">
                  Pts
                </Column>
                <Column className="w-[52px] text-right text-[11px] font-bold tracking-[1px] text-muted uppercase">
                  Move
                </Column>
              </Row>
              {teams.map((team) => (
                <TeamRow key={team.id} team={team} />
              ))}
            </Section>
            {othersReceivingVotes ? (
              <Section className="px-8">
                <Text className="text-[13px] leading-[19px] text-muted">
                  <strong className="text-ink">Also receiving votes:</strong>{" "}
                  {othersReceivingVotes}
                </Text>
              </Section>
            ) : null}
            <Section className="px-8 pt-2 pb-8">
              <Button
                href={pollUrl}
                className="rounded-md bg-brand px-6 py-3 text-[15px] font-bold text-white [text-decoration:none]"
              >
                See the full poll
              </Button>
              <Text className="mt-4 mb-0 text-[14px] text-ink">
                Every voter&apos;s ballot is public.{" "}
                <Link
                  href={ballotsUrl}
                  className="text-brand [text-decoration:underline]"
                >
                  See how each one voted
                </Link>
                .
              </Text>
            </Section>
          </Container>
          <Container className="max-w-[600px] px-8">
            <Text className="text-center text-[12px] leading-[18px] text-muted">
              You&apos;re getting this because you asked for {pollName} alerts
              at{" "}
              <Link
                href={siteUrl}
                className="text-muted [text-decoration:underline]"
              >
                Redshirt Sports
              </Link>
              .{" "}
              <Link
                href={unsubscribeUrl}
                className="text-muted [text-decoration:underline]"
              >
                Unsubscribe
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

Top25AlertEmail.PreviewProps = {
  pollName: "FCS Top 25",
  weekLabel: "Week 11",
  year: 2026,
  pollUrl:
    "https://www.redshirtsports.com/college/football/rankings/fcs/2026/11",
  ballotsUrl:
    "https://www.redshirtsports.com/college/football/rankings/fcs/2026/11/ballots",
  siteUrl: "https://www.redshirtsports.com",
  unsubscribeUrl: "https://www.redshirtsports.com",
  logo: PREVIEW_LOGO_ON_DARK,
  othersReceivingVotes: "Montana 41, Idaho 12, Sacramento State 3",
  teams: [
    {
      id: "1",
      rank: 1,
      isTie: false,
      name: "North Dakota State",
      points: 625,
      firstPlaceVotes: 25,
      movement: { kind: "same" },
    },
    {
      id: "2",
      rank: 2,
      isTie: false,
      name: "South Dakota State",
      points: 590,
      firstPlaceVotes: 0,
      movement: { kind: "up", delta: 1 },
    },
    {
      id: "3",
      rank: 3,
      isTie: false,
      name: "Montana State",
      points: 571,
      firstPlaceVotes: 0,
      movement: { kind: "down", delta: 1 },
    },
    {
      id: "4",
      rank: 4,
      isTie: true,
      name: "Villanova",
      points: 540,
      firstPlaceVotes: 0,
      movement: { kind: "new" },
    },
    {
      id: "5",
      rank: 4,
      isTie: true,
      name: "Mercer",
      points: 540,
      firstPlaceVotes: 0,
      movement: { kind: "up", delta: 4 },
    },
  ],
} satisfies Top25AlertEmailProps;
