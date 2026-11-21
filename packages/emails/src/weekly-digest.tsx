import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { type EmailLogo, PREVIEW_LOGO_ON_DARK, Wordmark } from "./logo";
import { emailTailwind } from "./theme";

export type DigestArticle = {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  /** A JPEG: some clients won't show WebP. */
  imageUrl: string | null;
  /** "Football · By Jane Doe" */
  meta: string;
};

export type WeeklyDigestEmailProps = {
  weekLabel: string;
  siteUrl: string;
  articles: DigestArticle[];
  /** Resend fills `{{{RESEND_UNSUBSCRIBE_URL}}}` per recipient. */
  unsubscribeUrl: string;
  /** The wordmark for the dark header band. */
  logo: EmailLogo | null;
};

function Lead({ article }: { article: DigestArticle }) {
  return (
    <Section className="mb-2">
      {article.imageUrl ? (
        <Link href={article.url}>
          <Img
            src={article.imageUrl}
            alt={article.title}
            width="560"
            // No height, in CSS or as an attribute: every client then keeps
            // the photo's own proportions as the width shrinks to fit.
            className="w-full rounded-md"
          />
        </Link>
      ) : null}
      <Text className="mt-4 mb-1 text-[12px] font-bold tracking-[1px] text-brand uppercase">
        {article.meta}
      </Text>
      <Heading as="h2" className="m-0 text-[24px] leading-[30px]">
        <Link href={article.url} className="text-ink [text-decoration:none]">
          {article.title}
        </Link>
      </Heading>
      <Text className="mt-2 text-[16px] leading-[24px] text-ink">
        {article.excerpt}
      </Text>
    </Section>
  );
}

function Item({ article }: { article: DigestArticle }) {
  return (
    <Section>
      <Hr className="my-5 border-none border-t border-solid border-rule" />
      <Row>
        {article.imageUrl ? (
          <Column className="w-[140px] pr-4 align-top">
            <Link href={article.url}>
              <Img
                src={article.imageUrl}
                alt={article.title}
                width="140"
                height="79"
                className="rounded"
              />
            </Link>
          </Column>
        ) : null}
        <Column className="align-top">
          <Text className="m-0 mb-1 text-[11px] font-bold tracking-[1px] text-brand uppercase">
            {article.meta}
          </Text>
          <Heading as="h3" className="m-0 text-[17px] leading-[23px]">
            <Link
              href={article.url}
              className="text-ink [text-decoration:none]"
            >
              {article.title}
            </Link>
          </Heading>
          <Text className="mt-1 mb-0 text-[14px] leading-[20px] text-muted">
            {article.excerpt}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

export default function WeeklyDigestEmail({
  weekLabel,
  siteUrl,
  articles,
  unsubscribeUrl,
  logo,
}: WeeklyDigestEmailProps) {
  const [lead, ...rest] = articles;
  const count = articles.length;
  return (
    <Html lang="en">
      <Tailwind config={emailTailwind}>
        <Head />
        <Body className="bg-paper m-0 py-8 font-sans">
          <Preview>
            {`${count} ${count === 1 ? "story" : "stories"} from the week: ${lead?.title ?? ""}`}
          </Preview>
          <Container className="max-w-[600px] bg-white">
            <Section className="bg-ink px-8 py-6">
              <Wordmark logo={logo} textClassName="text-white" />
              <Heading
                as="h1"
                className="mt-2 mb-0 text-[28px] leading-[34px] text-white"
              >
                The Week in College Sports
              </Heading>
              <Text className="mt-1 mb-0 text-[14px] text-[#c9ccd3]">
                Week of {weekLabel} · {count}{" "}
                {count === 1 ? "story" : "stories"}
              </Text>
            </Section>
            <Section className="px-8 pt-8 pb-4">
              {lead ? <Lead article={lead} /> : null}
              {rest.map((article) => (
                <Item key={article.id} article={article} />
              ))}
            </Section>
            <Section className="px-8 pb-8 text-center">
              <Button
                href={`${siteUrl}/college/news`}
                className="rounded-md bg-brand px-6 py-3 text-[15px] font-bold text-white [text-decoration:none]"
              >
                Read more on Redshirt Sports
              </Button>
            </Section>
          </Container>
          <Container className="max-w-[600px] px-8">
            <Text className="text-center text-[12px] leading-[18px] text-muted">
              You&apos;re getting this because you subscribed at{" "}
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

WeeklyDigestEmail.PreviewProps = {
  weekLabel: "Nov 13",
  siteUrl: "https://www.redshirtsports.com",
  unsubscribeUrl: "https://www.redshirtsports.com",
  articles: [
    {
      id: "1",
      title: "Montana State holds off Montana in the Brawl of the Wild",
      excerpt:
        "The Bobcats survived a fourth-quarter rally to keep the Great Divide Trophy in Bozeman.",
      url: "https://www.redshirtsports.com/example-lead",
      imageUrl: null,
      meta: "Football · By Redshirt Staff",
    },
    {
      id: "2",
      title: "FCS Top 25: South Dakota State stays No. 1",
      excerpt:
        "The Jackrabbits remain unanimous as the playoff field takes shape.",
      url: "https://www.redshirtsports.com/example-rankings",
      imageUrl: null,
      meta: "Football · By Redshirt Staff",
    },
  ],
  logo: PREVIEW_LOGO_ON_DARK,
} satisfies WeeklyDigestEmailProps;
