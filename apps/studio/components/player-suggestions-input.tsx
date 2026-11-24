import {
  externalKey,
  type PlayerTag,
  parseExternalRef,
} from "@redshirt-sports/sanity/external-refs";
import { AddIcon } from "@sanity/icons/Add";
import { Button, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import {
  type ArrayOfObjectsInputProps,
  insert,
  setIfMissing,
  useClient,
  useFormValue,
} from "sanity";

import { blockText } from "@/house-rules/body";
import { isTextBlock } from "@/house-rules/types";
import {
  searchEspnPlayers,
  searchPortalPlayers,
} from "@/schemaTypes/definitions/external-refs";
import { API_VERSION } from "@/utils/constant";
import type { PickerOption } from "@/utils/external-pickers";
import {
  matchingOption,
  namedAsStaff,
  normalizeName,
  rankedNames,
  SCOPE_TO_TEAMS,
  withoutSchools,
} from "@/utils/player-suggestions";

const MAX_SUGGESTIONS = 3;
const DEBOUNCE_MS = 1500;

/** One search per name per Studio session: bodies change, names rarely do. */
const searches = new Map<string, Promise<PickerOption[]>>();
function search(name: string) {
  let pending = searches.get(name);
  if (!pending) {
    pending = Promise.all([
      searchPortalPlayers(name),
      searchEspnPlayers(name),
    ]).then(([ours, espn]) => [...ours, ...espn]);
    searches.set(name, pending);
  }
  return pending;
}

type Ref = { _ref?: string };

/** The article's school names, for keeping suggestions to its teams. */
function useTeamNames(): string[] {
  const teams = useFormValue(["teams"]) as Ref[] | undefined;
  const ids = useMemo(
    () => (teams ?? []).map((team) => team._ref).filter(Boolean) as string[],
    [teams],
  );
  const client = useClient({ apiVersion: API_VERSION });
  const [names, setNames] = useState<string[]>([]);
  const idKey = ids.join(",");
  useEffect(() => {
    if (!idKey) {
      setNames([]);
      return;
    }
    let live = true;
    client
      .fetch<
        Array<{ name?: string; shortName?: string; abbreviation?: string }>
      >(
        `*[_id in $ids]{"name": coalesce(name, title), shortName, abbreviation}`,
        { ids: idKey.split(",") },
      )
      .then((rows) => {
        if (live) {
          setNames(
            rows.flatMap((row) =>
              [row.shortName, row.name, row.abbreviation].filter(Boolean),
            ) as string[],
          );
        }
      })
      .catch(() => live && setNames([]));
    return () => {
      live = false;
    };
  }, [client, idKey]);
  return names;
}

/** Every school's names, once per session: a candidate named "Sam Houston" is a school. */
let schoolNames: Promise<Set<string>> | null = null;
function useSchoolNames(): Set<string> {
  const client = useClient({ apiVersion: API_VERSION });
  const [names, setNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    schoolNames ??= client
      .fetch<string[]>(
        `*[_type == "school"]{"n": [coalesce(name, title), shortName]}.n[]`,
      )
      .then((list) => new Set(list.filter(Boolean).map(normalizeName)))
      .catch(() => {
        schoolNames = null;
        return new Set<string>();
      });
    let live = true;
    schoolNames.then((set) => live && setNames(set));
    return () => {
      live = false;
    };
  }, [client]);
  return names;
}

function plainText(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return body
    .filter(isTextBlock)
    .map((block) => blockText(block))
    .join("\n");
}

/**
 * The players list, with the players the article seems to be about offered
 * above it. Nothing is added until an editor picks one.
 */
export function PlayerSuggestionsInput(
  props: ArrayOfObjectsInputProps<PlayerTag & { _key: string }>,
) {
  const { value, onChange, readOnly } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const body = useFormValue(["body"]);
  const teams = useTeamNames();
  const schools = useSchoolNames();
  const [suggestions, setSuggestions] = useState<PickerOption[]>([]);

  const text = useMemo(() => plainText(body), [body]);
  const tagged = useMemo(
    () => new Set((value ?? []).map((tag) => tag.key).filter(Boolean)),
    [value],
  );

  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      const found: PickerOption[] = [];
      const article = `${title ?? ""}\n${text}`;
      const names = withoutSchools(rankedNames(title, text), schools).filter(
        (name) => !namedAsStaff(name, article),
      );
      for (const name of names) {
        const option = matchingOption(
          name,
          await search(name),
          SCOPE_TO_TEAMS ? teams : [],
        );
        if (option && !found.some((o) => o.value === option.value)) {
          found.push(option);
        }
        if (found.length === MAX_SUGGESTIONS) break;
      }
      if (live) setSuggestions(found);
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [title, text, teams, schools]);

  const open = suggestions.filter((option) => {
    const ref = parseExternalRef(option.value);
    return ref && !tagged.has(externalKey(ref));
  });

  const add = (option: PickerOption) => {
    const ref = parseExternalRef(option.value);
    if (!ref) return;
    const tag = {
      _type: "playerRef",
      _key: Math.random().toString(36).slice(2, 14),
      ref: option.value,
      key: externalKey(ref),
    };
    onChange([setIfMissing([]), insert([tag], "after", [-1])]);
  };

  // Below the list, so suggestions arriving never push the list down.
  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      {open.length > 0 && !readOnly ? (
        <Stack gap={2}>
          <Text size={1} muted>
            Suggested from the article
          </Text>
          <Flex gap={2} wrap="wrap">
            {open.map((option) => (
              <Button
                key={option.value}
                icon={AddIcon}
                mode="ghost"
                fontSize={1}
                padding={2}
                text={parseExternalRef(option.value)?.label ?? option.label}
                onClick={() => add(option)}
              />
            ))}
          </Flex>
        </Stack>
      ) : null}
    </Stack>
  );
}
