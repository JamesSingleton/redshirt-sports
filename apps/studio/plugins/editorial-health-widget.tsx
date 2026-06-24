import { Card, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient } from "sanity";

type HealthCounts = {
  missingStoryType: number;
  missingImage: number;
  missingSchoolSlug: number;
};

export function EditorialHealthWidget() {
  const client = useClient({ apiVersion: "2025-06-11" });
  const [counts, setCounts] = useState<HealthCounts | null>(null);

  useEffect(() => {
    client
      .fetch<HealthCounts>(`{
        "missingStoryType": count(*[_type == "post" && !defined(storyType)]),
        "missingImage": count(*[_type == "post" && !defined(image)]),
        "missingSchoolSlug": count(*[_type == "school" && !defined(slug.current)])
      }`)
      .then(setCounts)
      .catch(() => setCounts(null));
  }, [client]);

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={2} weight="semibold">
          Editorial health
        </Text>
        {counts ? (
          <Stack space={3}>
            <Flex justify="space-between">
              <Text size={1}>Posts missing story type</Text>
              <Text size={1} weight="medium">
                {counts.missingStoryType}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={1}>Posts missing image</Text>
              <Text size={1} weight="medium">
                {counts.missingImage}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={1}>Schools missing slug</Text>
              <Text size={1} weight="medium">
                {counts.missingSchoolSlug}
              </Text>
            </Flex>
          </Stack>
        ) : (
          <Text muted size={1}>
            Unable to load editorial health metrics.
          </Text>
        )}
      </Stack>
    </Card>
  );
}
