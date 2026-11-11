import { Card, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient } from "sanity";

import { LIMITS } from "@/house-rules/limits";
import { API_VERSION } from "@/utils/constant";

/**
 * Counts of published content that breaks a house rule the dataset can
 * answer for. Each row matches a list under Newsroom → Needs attention.
 */
export const HEALTH_CHECKS = [
  {
    id: "no-sport-or-level",
    title: "Articles with no sport or division",
    filter: `_type == "post" && (!defined(sport) || !defined(classification))`,
  },
  {
    id: "no-alt",
    title: "Articles whose lead image has no alt text",
    filter: `_type == "post" && !defined(image.alt)`,
  },
  {
    id: "long-headline-no-seo-title",
    title: "Long headlines with no SEO title",
    filter: `_type == "post" && length(title) > ${LIMITS.seoTitle.max} && !defined(seoTitle)`,
  },
  {
    id: "old-links",
    title: "Articles with old-format links",
    filter: `_type == "post" && count(body[].markDefs[_type in ["link", "internalLink", "customUrl"]]) > 0`,
  },
  {
    id: "no-teams",
    title: "Articles with no teams tagged",
    filter: `_type == "post" && count(coalesce(teams, [])) == 0`,
  },
  {
    id: "no-tags",
    title: "Articles with no tags",
    filter: `_type == "post" && count(coalesce(tags, [])) == 0`,
  },
  {
    id: "conference-no-level",
    title: "Conferences with no division",
    filter: `_type == "conference" && !defined(primaryClassification)`,
  },
  {
    id: "school-no-conference",
    title: "Schools with no conference",
    filter: `_type == "school" && count(coalesce(conferenceAffiliations, [])) == 0`,
  },
] as const;

type Counts = Record<string, number>;

const QUERY = `{${HEALTH_CHECKS.map(
  (check) => `"${check.id}": count(*[${check.filter}])`,
).join(",")}}`;

export function EditorialHealthWidget() {
  const client = useClient({ apiVersion: API_VERSION });
  const [counts, setCounts] = useState<Counts | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    client
      .fetch<Counts>(QUERY, {}, { perspective: "published" })
      .then(setCounts)
      .catch(() => setFailed(true));
  }, [client]);

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack gap={4}>
        <Text size={2} weight="semibold">
          Editorial health
        </Text>
        {failed && (
          <Text muted size={1}>
            Couldn't load the counts. Reload the page to try again.
          </Text>
        )}
        {!failed && !counts && (
          <Text muted size={1}>
            Loading…
          </Text>
        )}
        {counts && (
          <Stack gap={3}>
            {HEALTH_CHECKS.map((check) => (
              <Flex key={check.id} justify="space-between" gap={3}>
                <Text size={1}>{check.title}</Text>
                <Text size={1} weight="medium" muted={counts[check.id] === 0}>
                  {counts[check.id]}
                </Text>
              </Flex>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
