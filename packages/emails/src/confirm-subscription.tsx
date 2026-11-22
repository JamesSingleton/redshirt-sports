import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { type EmailLogo, PREVIEW_LOGO_ON_LIGHT, Wordmark } from "./logo";
import { emailTailwind } from "./theme";

export type ConfirmSubscriptionEmailProps = {
  confirmUrl: string;
  siteUrl: string;
  /** The wordmark for a white background. */
  logo: EmailLogo | null;
  /** What they ticked: "The Week in College Sports", "FCS Top 25 alerts". */
  choices: string[];
};

export default function ConfirmSubscriptionEmail({
  confirmUrl,
  siteUrl,
  logo,
  choices,
}: ConfirmSubscriptionEmailProps) {
  return (
    <Html lang="en">
      <Tailwind config={emailTailwind}>
        <Head />
        <Body className="bg-paper m-0 py-8 font-sans">
          <Preview>
            Confirm your Redshirt Sports newsletter subscription
          </Preview>
          <Container className="max-w-[560px] rounded-lg border border-solid border-rule bg-white px-8 py-8">
            <Wordmark logo={logo} textClassName="text-brand" />
            <Heading
              as="h1"
              className="mt-4 mb-0 text-[26px] leading-[32px] text-ink"
            >
              One click and you&apos;re on the list
            </Heading>
            <Text className="text-[16px] leading-[24px] text-ink">
              Confirm your email and you&apos;ll get:
            </Text>
            {choices.map((choice) => (
              <Text
                key={choice}
                className="my-1 text-[16px] leading-[24px] font-semibold text-ink"
              >
                ✓ {choice}
              </Text>
            ))}
            <Section className="my-6">
              <Button
                href={confirmUrl}
                className="rounded-md bg-brand px-6 py-3 text-[16px] font-bold text-white [text-decoration:none]"
              >
                Confirm my subscription
              </Button>
            </Section>
            <Text className="text-[14px] leading-[20px] text-muted">
              This link works for 7 days. If you didn&apos;t sign up at{" "}
              <Link
                href={siteUrl}
                className="text-muted [text-decoration:underline]"
              >
                Redshirt Sports
              </Link>
              , ignore this email and you won&apos;t hear from us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

ConfirmSubscriptionEmail.PreviewProps = {
  confirmUrl:
    "https://www.redshirtsports.com/api/newsletter/confirm?token=preview",
  siteUrl: "https://www.redshirtsports.com",
  logo: PREVIEW_LOGO_ON_LIGHT,
  choices: [
    "The Week in College Sports, every Sunday morning",
    "FCS Top 25 alerts",
  ],
} satisfies ConfirmSubscriptionEmailProps;
