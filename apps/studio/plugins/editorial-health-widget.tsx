import { Card, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient } from "sanity";

import { HEALTH_CHECKS } from "@/plugins/health-checks";
import { API_VERSION } from "@/utils/constant";

/** Counts for each check in `HEALTH_CHECKS`. */
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
