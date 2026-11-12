import { LinkIcon } from "@sanity/icons/Link";
import { UnlinkIcon } from "@sanity/icons/Unlink";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import {
  type StringInputProps,
  set,
  unset,
  useCurrentUser,
  useUser,
} from "sanity";

import { isAdministrator } from "@/utils/current-user";

/**
 * Links an author to the Studio account of the person who writes as them,
 * so new articles start with them in the byline. Stores only the Sanity
 * user id: the dataset is public, so no email.
 */
export function StudioAccountInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props;
  const currentUser = useCurrentUser();
  const [linkedUser] = useUser(value ?? "");
  const isMe = Boolean(value && value === currentUser?.id);
  const canUnlink = isMe || isAdministrator(currentUser);

  if (!value) {
    return (
      <Card padding={3} radius={2} border>
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1} muted>
            Not linked. Link it so new articles start with this author in the
            byline.
          </Text>
          <Button
            icon={LinkIcon}
            text="This is me"
            mode="ghost"
            disabled={readOnly || !currentUser}
            onClick={() => currentUser && onChange(set(currentUser.id))}
          />
        </Flex>
      </Card>
    );
  }

  return (
    <Card padding={3} radius={2} border tone={isMe ? "positive" : "default"}>
      <Flex align="center" justify="space-between" gap={3}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            {isMe
              ? "Linked to you"
              : `Linked to ${linkedUser?.displayName ?? "a Studio account"}`}
          </Text>
          <Text size={0} muted>
            {value}
          </Text>
        </Stack>
        {canUnlink && (
          <Button
            icon={UnlinkIcon}
            text="Unlink"
            mode="ghost"
            tone="critical"
            disabled={readOnly}
            onClick={() => onChange(unset())}
          />
        )}
      </Flex>
    </Card>
  );
}
