import { assist } from "@sanity/assist";
import {
  dashboardTool,
  projectInfoWidget,
  projectUsersWidget,
  sanityTutorialsWidget,
} from "@sanity/dashboard";
import { debugLiveSyncTags } from "@sanity/debug-live-sync-tags";
import { BellIcon } from "@sanity/icons/Bell";
import { visionTool } from "@sanity/vision";
import { CogIcon, PanelBottomIcon, PanelTopDashedIcon } from "lucide-react";
import type { PortableTextPluginsProps } from "sanity";
import { defineConfig, defineSingleton } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { documentListWidget } from "sanity-plugin-dashboard-widget-document-list";
import { media } from "sanity-plugin-media";

import { Logo } from "@/components/logo";
import { env } from "@/env";
import { STORY_TYPES } from "@/house-rules/post";
import { ArticleCheckBadge } from "@/plugins/article-check-badge";
import { useArticleFieldActions } from "@/plugins/assist-field-actions";
import { EditorialHealthWidget } from "@/plugins/editorial-health-widget";
import { presentationUrl } from "@/plugins/presentation-url";
import { resolve } from "@/presentation/resolve";
import { schemaTypes } from "@/schemaTypes";
import { getDefaultDocumentNode, structure } from "@/structure";
import { createCustomPostDuplicateAction } from "@/utils/actions";
import { isAdministrator } from "@/utils/current-user";

export default defineConfig({
  title: env.SANITY_STUDIO_TITLE,
  projectId: env.SANITY_STUDIO_PROJECT_ID,
  icon: Logo,
  dataset: env.SANITY_STUDIO_DATASET,
  plugins: [
    assist({
      fieldActions: {
        title: "Redshirt Sports",
        useFieldActions: useArticleFieldActions,
      },
    }),
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
        documentListWidget({
          title: "Just published",
          types: ["post"],
          order: "publishedAt desc",
          limit: 8,
          layout: { width: "medium" },
        }),
        documentListWidget({
          title: "Recently edited",
          types: ["post"],
          order: "_updatedAt desc",
          limit: 8,
          layout: { width: "medium" },
        }),
        projectInfoWidget(),
        projectUsersWidget(),
      ],
    }),
    media({
      creditLine: {
        enabled: true,
      },
    }),
    // Shows which cache tags each query gets. Administrators only (see `tools`).
    debugLiveSyncTags(),
  ],
  // Debugging tools aren't for writers.
  tools: (prev, { currentUser }) =>
    isAdministrator(currentUser)
      ? prev
      : prev.filter((tool) => tool.name !== "debug-live-sync-tags"),
  // Newsroom workflow, built into Studio. Scheduled drafts publish one article
  // at a set time, and Tasks hand an article to an editor for review.
  // Releases (articles that publish together) aren't on the current plan;
  // enable them here after an upgrade.
  releases: { enabled: false },
  scheduledDrafts: { enabled: true },
  tasks: { enabled: true },
  form: {
    components: {
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
    // Fixed-id documents the web app reads by `_id`. Studio hides them from
    // every "create new" menu and removes Duplicate; `structure.ts` lists them.
    singletons: [
      defineSingleton({
        documentId: "breakingNews",
        schemaType: "breakingNews",
        title: "Breaking news banner",
        icon: BellIcon,
      }),
      defineSingleton({
        documentId: "navbar",
        schemaType: "navbar",
        title: "Navigation",
        icon: PanelTopDashedIcon,
      }),
      defineSingleton({
        documentId: "footer",
        schemaType: "footer",
        title: "Footer",
        icon: PanelBottomIcon,
      }),
      defineSingleton({
        documentId: "settings",
        schemaType: "settings",
        title: "Global Settings",
        icon: CogIcon,
      }),
    ],
    newDocumentOptions: (prev, { creationContext, currentUser }) => {
      const { type } = creationContext;
      const isAdmin = isAdministrator(currentUser);

      if (type === "global") {
        // Parameterized templates only make sense from their own lists.
        const creatable = prev.filter(
          (option) =>
            option.templateId !== "post-by-sport" &&
            option.templateId !== "post-by-article-type",
        );
        if (!isAdmin) {
          // Taxonomy and site documents are admin-managed, so writers can't
          // mint a stray tag, level, or redirect from the "+" menu.
          const adminOnly = [
            "collection",
            "legal",
            "redirect",
            "advertisement",
            "tag",
            "sport",
            "governingBody",
            "classification",
            "sportSubgrouping",
            "conference",
          ];
          return creatable.filter(
            (option) => !adminOnly.includes(option.templateId),
          );
        }

        return creatable;
      }
      return prev;
    },
    badges: (badges, context) =>
      context.schemaType === "post" ? [...badges, ArticleCheckBadge] : badges,
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
        title: "Article by sport",
        schemaType: "post",
        parameters: [{ name: "sportId", type: "string" }],
        value: ({ sportId }: { sportId: string }) => ({
          sport: { _type: "reference", _ref: sportId },
        }),
      },
      {
        id: "post-by-article-type",
        title: "Article by type",
        schemaType: "post",
        parameters: [{ name: "storyType", type: "string" }],
        value: ({ storyType }: { storyType: string }) => ({ storyType }),
      },
      // One entry per article type in the global "+" menu.
      ...STORY_TYPES.filter((type) => type.value !== "news").map((type) => ({
        id: `post-${type.value}`,
        title: type.title,
        schemaType: "post",
        value: { storyType: type.value },
      })),
    ],
  },
});
