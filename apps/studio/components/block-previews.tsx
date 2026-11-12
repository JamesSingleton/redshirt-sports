import { PlayIcon } from "@sanity/icons/Play";
import { Badge, Box, Card, type CardTone, Flex, Stack, Text } from "@sanity/ui";
import type { ReactNode } from "react";
import type { PreviewProps } from "sanity";

/**
 * How body blocks look in the article editor, so an editor can tell a pull
 * quote from a callout at a glance. Each reads the standard preview fields
 * its schema's `preview.prepare` fills in (title, subtitle, description).
 */

const text = (value: PreviewProps["title"]): string | null =>
  typeof value === "string" && value.trim() ? value : null;

function Label({ children }: { children: ReactNode }) {
  return (
    <Text
      size={0}
      weight="semibold"
      muted
      style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
    >
      {children}
    </Text>
  );
}

/** title: the quote. subtitle: who said it. description: their role. */
export function PullQuotePreview(props: PreviewProps) {
  const quote = text(props.title);
  const who = [text(props.subtitle), text(props.description)]
    .filter(Boolean)
    .join(", ");
  return (
    <Card padding={3} radius={2}>
      <Flex gap={3}>
        <Box
          style={{
            width: 4,
            borderRadius: 2,
            background: "var(--card-focus-ring-color)",
            flex: "none",
          }}
        />
        <Stack gap={3}>
          <Label>Pull quote</Label>
          <Text size={2} style={{ fontStyle: "italic" }}>
            {quote ? `“${quote}”` : "Add the quote."}
          </Text>
          {who && (
            <Text size={1} muted>
              — {who}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  );
}

const CALLOUT_TONES: Record<string, { label: string; tone: CardTone }> = {
  context: { label: "Context", tone: "primary" },
  numbers: { label: "By the numbers", tone: "positive" },
  update: { label: "Update", tone: "caution" },
};

/** title: the heading. subtitle: the kind. description: the text. */
export function CalloutPreview(props: PreviewProps) {
  const kind =
    CALLOUT_TONES[text(props.subtitle) ?? "context"] ?? CALLOUT_TONES.context!;
  const title = text(props.title);
  const body = text(props.description);
  return (
    <Card padding={3} radius={2} tone={kind.tone} border>
      <Stack gap={3}>
        <Label>{kind.label}</Label>
        {title && (
          <Text size={2} weight="semibold">
            {title}
          </Text>
        )}
        <Text size={1} muted={!body} textOverflow="ellipsis">
          {body ?? "Add the callout text."}
        </Text>
      </Stack>
    </Card>
  );
}

/** title and media: the linked article. subtitle: the kicker. */
export function RelatedArticlePreview(props: PreviewProps) {
  return (
    <Card radius={2} border>
      <Stack gap={2} paddingX={3} paddingTop={3}>
        <Label>{text(props.subtitle) ?? "Related"}</Label>
      </Stack>
      {props.renderDefault({
        ...props,
        subtitle: undefined,
        title: text(props.title) ?? "Pick the article to link to.",
      })}
    </Card>
  );
}

/** title: the video id. subtitle: the URL. */
export function YouTubePreview(props: PreviewProps) {
  const videoId = text(props.title);
  const url = text(props.subtitle);
  return (
    <Card padding={3} radius={2}>
      <Stack gap={3}>
        <Label>YouTube video</Label>
        {videoId ? (
          <Box style={{ position: "relative", maxWidth: 320 }}>
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "16 / 9",
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
            <Flex
              align="center"
              justify="center"
              style={{
                position: "absolute",
                inset: 0,
                fontSize: 40,
                color: "white",
                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              }}
            >
              <PlayIcon />
            </Flex>
          </Box>
        ) : (
          <Text size={1} muted>
            Paste a YouTube link.
          </Text>
        )}
        {url && (
          <Text size={1} muted textOverflow="ellipsis">
            {url}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

/** title: the caption. subtitle: the platform. description: the URL. */
export function SocialEmbedPreview(props: PreviewProps) {
  const caption = text(props.title);
  const platform = text(props.subtitle);
  const url = text(props.description);
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={3}>
        <Flex gap={2} align="center">
          <Label>Social post</Label>
          {platform && <Badge tone="primary">{platform}</Badge>}
        </Flex>
        <Text size={2}>
          {caption ?? "Add a caption saying what the post shows."}
        </Text>
        {url && (
          <Text size={1} muted textOverflow="ellipsis">
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          </Text>
        )}
      </Stack>
    </Card>
  );
}
