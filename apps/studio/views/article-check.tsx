import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { Badge, Box, Card, Flex, Grid, Heading, Stack, Text } from "@sanity/ui";
import { useMemo } from "react";
import type { SanityDocument } from "sanity";

import { LIMITS } from "@/house-rules/limits";
import {
  checkStory,
  type PostLike,
  type StoryCheckSection,
} from "@/house-rules/post";
import { type GroupedFinding, groupFindings } from "@/house-rules/types";

type ViewProps = {
  document: { displayed: Partial<SanityDocument> };
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card border padding={3} radius={2}>
      <Stack gap={2}>
        <Text muted size={1}>
          {label}
        </Text>
        <Text size={3} weight="semibold">
          {value}
        </Text>
      </Stack>
    </Card>
  );
}

function FindingRow({ finding }: { finding: GroupedFinding }) {
  const isError = finding.level === "error";
  return (
    <Card padding={3} radius={2} tone={isError ? "critical" : "caution"} border>
      <Flex align="flex-start" gap={3}>
        <Text size={2}>
          {isError ? <ErrorOutlineIcon /> : <WarningOutlineIcon />}
        </Text>
        <Box flex={1}>
          <Text size={1}>{finding.message}</Text>
        </Box>
        {finding.count > 1 && (
          <Badge tone={isError ? "critical" : "caution"}>
            {finding.count} places
          </Badge>
        )}
      </Flex>
    </Card>
  );
}

function Section({ section }: { section: StoryCheckSection }) {
  const grouped = groupFindings(section.findings);
  const errors = grouped.filter((f) => f.level === "error").length;
  const warnings = grouped.length - errors;

  return (
    <Stack gap={3}>
      <Flex align="center" gap={2}>
        <Heading as="h3" size={1}>
          {section.title}
        </Heading>
        {grouped.length === 0 ? (
          <Badge tone="positive">Good</Badge>
        ) : (
          <>
            {errors > 0 && <Badge tone="critical">{errors} to fix</Badge>}
            {warnings > 0 && (
              <Badge tone="caution">
                {warnings} suggestion{warnings === 1 ? "" : "s"}
              </Badge>
            )}
          </>
        )}
      </Flex>
      {grouped.map((finding) => (
        <FindingRow
          key={`${finding.level}|${finding.rule}|${finding.message}`}
          finding={finding}
        />
      ))}
    </Stack>
  );
}

/**
 * The house rules as one checklist, read from the same functions that power
 * field validation. Checks that need the dataset (subdivision membership,
 * duplicate slugs) run on the form only.
 */
export function ArticleCheck({ document }: ViewProps) {
  const check = useMemo(
    () => checkStory(document.displayed as PostLike),
    [document.displayed],
  );
  const { stats } = check;
  const all = check.sections.flatMap((section) =>
    groupFindings(section.findings),
  );
  const errors = all.filter((f) => f.level === "error").length;
  const warnings = all.length - errors;

  return (
    <Box padding={4} style={{ maxWidth: 720, margin: "0 auto" }}>
      <Stack gap={5}>
        <Card
          padding={4}
          radius={2}
          tone={errors > 0 ? "critical" : "positive"}
          border
        >
          <Flex align="center" gap={3}>
            <Text size={3}>
              {errors > 0 ? <ErrorOutlineIcon /> : <CheckmarkCircleIcon />}
            </Text>
            <Stack gap={2}>
              <Text size={2} weight="semibold">
                {errors > 0
                  ? `${errors} thing${errors === 1 ? "" : "s"} to fix before publishing`
                  : "Ready to publish"}
              </Text>
              <Text muted size={1}>
                {warnings > 0
                  ? `${warnings} suggestion${warnings === 1 ? "" : "s"} you can act on or overrule.`
                  : "No suggestions."}
              </Text>
            </Stack>
          </Flex>
        </Card>

        <Grid
          gap={3}
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          <Stat label="Words" value={stats.words.toLocaleString("en-US")} />
          <Stat label="Read time" value={`${stats.readingMinutes} min`} />
          <Stat
            label="Headline"
            value={`${stats.headlineChars} / ${LIMITS.headline.ideal}`}
          />
          <Stat
            label="Summary"
            value={`${stats.excerptChars} / ${LIMITS.excerpt.idealMax}`}
          />
          <Stat label="Subheadings" value={String(stats.headings)} />
          <Stat
            label="Photos & embeds"
            value={String(stats.images + stats.embeds)}
          />
          <Stat label="Internal links" value={String(stats.internalLinks)} />
          <Stat label="External links" value={String(stats.externalLinks)} />
        </Grid>

        {check.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </Stack>
    </Box>
  );
}
