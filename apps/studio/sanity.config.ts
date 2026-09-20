import { assist } from "@sanity/assist";
import {
  dashboardTool,
  projectInfoWidget,
  projectUsersWidget,
  sanityTutorialsWidget,
} from "@sanity/dashboard";
import { table } from "@sanity/table";
import { visionTool } from "@sanity/vision";
import type {
  InputProps,
  PortableTextInputProps,
  PortableTextPluginsProps,
} from "sanity";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { media } from "sanity-plugin-media";

import { CharacterCountInputPTE } from "@/components/character-count";
import { Logo } from "@/components/logo";
import { env } from "@/env";
import { EditorialHealthWidget } from "@/plugins/editorial-health-widget";
import { presentationUrl } from "@/plugins/presentation-url";
import { resolve } from "@/presentation/resolve";
import { schemaTypes } from "@/schemaTypes";
import { getDefaultDocumentNode, structure } from "@/structure";
import { createCustomPostDuplicateAction } from "@/utils/actions";

export default defineConfig({
  title: env.SANITY_STUDIO_TITLE,
  projectId: env.SANITY_STUDIO_PROJECT_ID,
  icon: Logo,
  dataset: env.SANITY_STUDIO_DATASET,
  plugins: [
    assist(),
    structureTool({
      structure,
      defaultDocumentNode: getDefaultDocumentNode,
    }),
    presentationTool({
      resolve,
      previewUrl: {
        origin: env.SANITY_STUDIO_PRESENTATION_URL,
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    presentationUrl(),
    visionTool(),
    dashboardTool({
      widgets: [
        sanityTutorialsWidget(),
        {
          name: "editorial-health",
          component: EditorialHealthWidget,
          layout: { width: "medium" },
        },
        projectInfoWidget(),
        projectUsersWidget(),
      ],
    }),
    media({
      creditLine: {
        enabled: true,
      },
    }),
    table(),
  ],
  form: {
    components: {
      input: (props: InputProps) => {
        if (props.schemaType.name === "blockContent") {
          return CharacterCountInputPTE(props as PortableTextInputProps);
        }

        return props.renderDefault(props);
      },
      portableText: {
        plugins: (props: PortableTextPluginsProps) =>
          props.renderDefault({
            ...props,
            plugins: {
              ...props.plugins,
              table: { enabled: true },
            },
          }),
      },
    },
  },
  document: {
    newDocumentOptions: (prev, { creationContext, currentUser }) => {
      const { type } = creationContext;
      const isAdmin = currentUser?.roles?.find(
        ({ name }) => name === "administrator",
      );

      if (type === "global") {
        if (!isAdmin) {
          return prev.filter(
            (option) =>
              option.templateId !== "settings" &&
              option.templateId !== "legal" &&
              option.templateId !== "redirect" &&
              option.templateId !== "footer" &&
              option.templateId !== "navbar",
          );
        }

        return prev;
      }
      return prev;
    },
    actions: (actions, context) =>
      context.schemaType === "post"
        ? actions.map((actionItem) =>
            actionItem.action === "duplicate"
              ? createCustomPostDuplicateAction(actionItem)
              : actionItem,
          )
        : actions,
  },
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: "post-by-sport",
        title: "Post by Sport",
        schemaType: "post",
        parameters: [{ name: "sportId", type: "string" }],
        value: ({ sportId }: { sportId: string }) => ({
          sport: { _type: "reference", _ref: sportId },
        }),
      },
      {
        id: "post-recruiting",
        title: "Recruiting Article",
        schemaType: "post",
        value: { storyType: "recruiting" },
      },
      {
        id: "post-transfer",
        title: "Transfer Portal Article",
        schemaType: "post",
        value: { storyType: "transfer" },
      },
      {
        id: "post-game-recap",
        title: "Game Recap",
        schemaType: "post",
        value: { storyType: "game-recap" },
      },
    ],
  },
});
