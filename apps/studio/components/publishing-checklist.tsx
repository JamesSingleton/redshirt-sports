/**
 * publishing-checklist.tsx
 *
 * A Sanity document view panel that gives writers and editors a single-glance
 * summary of which required fields are complete before publishing.
 *
 * Register it as a view in structure.ts:
 *
 *   import { PublishingChecklistView } from "./components/publishing-checklist";
 *
 *   case "post":
 *     return S.document().views([
 *       S.view.form().icon(ComposeIcon).title("Edit"),
 *       S.view
 *         .component(PublishingChecklistView)
 *         .title("Publishing Checklist")
 *         .icon(CheckmarkCircleIcon),
 *       postReferences(S),
 *     ]);
 */

import {
  CheckmarkCircleIcon,
  CircleIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import { Badge, Box, Card, Flex, Stack, Text, Tooltip } from "@sanity/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

// Sanity passes { document: { displayed, draft, published } } to view components.
interface ViewProps {
  document: {
    displayed: Record<string, unknown>;
  };
}

type CheckStatus = "pass" | "warn" | "fail";

interface CheckItem {
  label: string;
  hint: string;
  status: CheckStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasMinLength(value: unknown, min: number): boolean {
  return typeof value === "string" && value.length >= min;
}

function hasMaxLength(value: unknown, max: number): boolean {
  return typeof value === "string" && value.length <= max;
}

function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function isReference(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "_ref" in value &&
    typeof (value as Record<string, unknown>)._ref === "string"
  );
}

function hasImageAsset(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "asset" in value &&
    isReference((value as Record<string, unknown>).asset)
  );
}

function getImageField(
  image: Record<string, unknown> | undefined,
  field: string,
): string | undefined {
  if (!image) return undefined;
  const val = image[field];
  return typeof val === "string" && val.length > 0 ? val : undefined;
}

function extractWordCount(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 0;
  const text = (
    blocks as Array<{
      _type: string;
      children?: Array<{ _type: string; text?: string }>;
    }>
  )
    .filter((b) => b._type === "block" && Array.isArray(b.children))
    .flatMap((b) => b.children ?? [])
    .filter((s) => s._type === "span")
    .map((s) => s.text ?? "")
    .join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Check Definitions ────────────────────────────────────────────────────────

function buildChecks(doc: Record<string, unknown>): CheckItem[] {
  const mainImage = doc.mainImage as Record<string, unknown> | undefined;
  const excerpt = doc.excerpt as string | undefined;
  const title = doc.title as string | undefined;
  const wordCount = extractWordCount(doc.body);
  const excerptLength = typeof excerpt === "string" ? excerpt.length : 0;

  return [
    // ── Content ─────────────────────────────────────────────────────────────
    {
      label: "Title",
      hint: "A title is required.",
      status: isNonEmptyArray([doc.title]) ? "pass" : "fail",
    },
    {
      label: "Title length (15–70 chars)",
      hint: `Ideal title length is 15–70 characters. Currently ${typeof title === "string" ? title.length : 0}.`,
      status:
        hasMinLength(doc.title, 15) && hasMaxLength(doc.title, 70)
          ? "pass"
          : "warn",
    },
    {
      label: "URL / Slug",
      hint: "Generate a slug from the title using the Generate button.",
      status:
        isReference(doc.slug) ||
        (typeof (doc.slug as any)?.current === "string" &&
          (doc.slug as any).current.length > 0)
          ? "pass"
          : "fail",
    },
    {
      label: "Author(s)",
      hint: "At least one author must be selected.",
      status: isNonEmptyArray(doc.authors) ? "pass" : "fail",
    },
    {
      label: "Hero image",
      hint: "Upload and set a hero image for the article.",
      status: hasImageAsset(mainImage) ? "pass" : "fail",
    },
    {
      label: "Image caption",
      hint: "Briefly describe what is shown in the hero image.",
      status: getImageField(mainImage, "caption") ? "pass" : "fail",
    },
    {
      label: "Image attribution",
      hint: "Credit the photographer or image source.",
      status: getImageField(mainImage, "attribution") ? "pass" : "fail",
    },
    {
      label: "Image alt text",
      hint: "Describe the image for screen readers and search engines.",
      status: getImageField(mainImage, "alt") ? "pass" : "fail",
    },
    {
      label: "Body content",
      hint: "The article body cannot be empty.",
      status: isNonEmptyArray(doc.body) ? "pass" : "fail",
    },
    {
      label: `Word count (300+ recommended, ${wordCount} now)`,
      hint: "Articles under 300 words may underperform in search.",
      status: wordCount >= 300 ? "pass" : wordCount > 0 ? "warn" : "fail",
    },

    // ── Excerpt ─────────────────────────────────────────────────────────────
    {
      label: `Excerpt — ${excerptLength} / 160 chars`,
      hint: "An excerpt is required for SEO and social sharing.",
      status: isNonEmptyArray([doc.excerpt]) ? "pass" : "fail",
    },
    {
      label: "Excerpt length (140–160 chars)",
      hint: "Keep the excerpt between 140 and 160 characters to avoid truncation in search results.",
      status:
        hasMinLength(doc.excerpt, 140) && hasMaxLength(doc.excerpt, 160)
          ? "pass"
          : excerptLength > 0
            ? "warn"
            : "fail",
    },

    // ── Categorization ──────────────────────────────────────────────────────
    {
      label: "Sport",
      hint: "Tag this article with a sport so it appears in the right sport feed.",
      status: isReference(doc.sport) ? "pass" : "warn",
    },
    {
      label: "Division",
      hint: "Tagging a division helps surface the article in division-level navigation.",
      status: isReference(doc.division) ? "pass" : "warn",
    },

    // ── Workflow ─────────────────────────────────────────────────────────────
    {
      label: "Editorial status is 'Ready'",
      hint: "Change the status to 'Ready to Publish' once the editor has approved.",
      status:
        doc.status === "ready" || doc.status === "published" ? "pass" : "warn",
    },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({ item }: { item: CheckItem }) {
  const toneMap: Record<CheckStatus, "positive" | "caution" | "critical"> = {
    pass: "positive",
    warn: "caution",
    fail: "critical",
  };

  const iconMap: Record<CheckStatus, React.ReactNode> = {
    pass: <CheckmarkCircleIcon style={{ color: "var(--green-400)" }} />,
    warn: <WarningOutlineIcon style={{ color: "var(--yellow-400)" }} />,
    fail: <CircleIcon style={{ color: "var(--red-400)" }} />,
  };

  return (
    <Tooltip
      content={
        <Box padding={2} style={{ maxWidth: 260 }}>
          <Text size={1}>{item.hint}</Text>
        </Box>
      }
      placement="left"
      portal
    >
      <Card
        padding={3}
        radius={2}
        tone={item.status === "pass" ? "default" : toneMap[item.status]}
        style={{ cursor: "default" }}
      >
        <Flex align="center" gap={3}>
          <Box flex="none">{iconMap[item.status]}</Box>
          <Text
            size={1}
            weight={item.status === "fail" ? "semibold" : "regular"}
          >
            {item.label}
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function PublishingChecklistView({ document }: ViewProps) {
  const doc = document.displayed;
  const checks = buildChecks(doc);

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const total = checks.length;

  const allGood = failed === 0 && warned === 0;

  return (
    <Box padding={4}>
      <Stack space={4}>
        {/* Summary header */}
        <Card
          padding={4}
          radius={3}
          tone={allGood ? "positive" : failed > 0 ? "critical" : "caution"}
        >
          <Stack space={3}>
            <Text size={2} weight="semibold">
              {allGood
                ? "All checks passed — ready to publish"
                : failed > 0
                  ? `${failed} required field${failed > 1 ? "s" : ""} missing`
                  : `${warned} item${warned > 1 ? "s" : ""} need attention`}
            </Text>
            <Flex gap={2} wrap="wrap">
              <Badge tone="positive" mode="outline">
                {passed} passed
              </Badge>
              {warned > 0 && (
                <Badge tone="caution" mode="outline">
                  {warned} warnings
                </Badge>
              )}
              {failed > 0 && (
                <Badge tone="critical" mode="outline">
                  {failed} required
                </Badge>
              )}
              <Badge tone="default" mode="outline">
                {total} total checks
              </Badge>
            </Flex>
          </Stack>
        </Card>

        {/* Checklist items */}
        <Stack space={2}>
          {checks.map((item) => (
            <CheckRow key={item.label} item={item} />
          ))}
        </Stack>

        <Text size={1} muted style={{ fontStyle: "italic" }}>
          Hover over any item for guidance. Warnings won't block publishing but
          may affect SEO or reader experience.
        </Text>
      </Stack>
    </Box>
  );
}
