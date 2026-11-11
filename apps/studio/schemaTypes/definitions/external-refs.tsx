import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";
import { createAsyncListInput } from "@sanity/sanity-plugin-async-list";
import { defineType } from "sanity";

import { env } from "@/env";
import {
  type GameSearchResult,
  gameOptions,
  type PickerOption,
  playerOptions,
} from "@/utils/external-pickers";

/**
 * Games and players live with the data providers, never in Sanity (see
 * packages/sanity/src/external-refs.ts). These string types store the
 * provider id plus a label snapshot, chosen from a live search.
 */

const showLabel = (value: string, option?: PickerOption) =>
  option?.label ?? parseExternalRef(value)?.label ?? value;

const externalRefRule = (kind: string) => (value: string | undefined) =>
  !value || parseExternalRef(value)
    ? true
    : `This ${kind} isn't in the expected format. Clear it and pick it again from the list.`;

export const gameRef = defineType({
  name: "gameRef",
  title: "Game",
  type: "string",
  components: {
    input: createAsyncListInput<PickerOption>({
      loaderType: "search",
      loader: async ({ query }) => {
        if (!query || query.trim().length < 3) return [];
        const url = new URL(
          "/api/v1/college/games",
          env.SANITY_STUDIO_PRESENTATION_URL,
        );
        url.searchParams.set("q", query.trim());
        const response = await fetch(url);
        if (!response.ok) return [];
        const { games } = (await response.json()) as {
          games: GameSearchResult[];
        };
        return gameOptions(games);
      },
      autocompleteProps: {
        placeholder: "Type a team, e.g. Montana",
        renderOption: (option) => (
          <div style={{ padding: 8 }}>{option.label}</div>
        ),
        renderValue: showLabel,
      },
    }),
  },
  validation: (rule) => rule.custom(externalRefRule("game")),
});

export const playerRef = defineType({
  name: "playerRef",
  title: "Player",
  type: "string",
  components: {
    input: createAsyncListInput<PickerOption>({
      loaderType: "search",
      loader: async ({ query }) => {
        if (!query || query.trim().length < 3) return [];
        const url = new URL("https://site.web.api.espn.com/apis/search/v2");
        url.searchParams.set("query", query.trim());
        url.searchParams.set("type", "player");
        url.searchParams.set("limit", "20");
        const response = await fetch(url);
        if (!response.ok) return [];
        return playerOptions(await response.json());
      },
      autocompleteProps: {
        placeholder: "Type a player's name",
        renderOption: (option) => (
          <div style={{ padding: 8 }}>{option.label}</div>
        ),
        renderValue: showLabel,
      },
    }),
  },
  validation: (rule) => rule.custom(externalRefRule("player")),
});
