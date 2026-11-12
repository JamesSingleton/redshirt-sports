import { ActivityIcon } from "@sanity/icons/Activity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { ComposeIcon } from "@sanity/icons/Compose";
import { DocumentsIcon } from "@sanity/icons/Documents";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { EarthAmericasIcon } from "@sanity/icons/EarthAmericas";
import { EditIcon } from "@sanity/icons/Edit";
import { HomeIcon } from "@sanity/icons/Home";
import { LinkIcon } from "@sanity/icons/Link";
import { RedoIcon } from "@sanity/icons/Redo";
import { SplitVerticalIcon } from "@sanity/icons/SplitVertical";
import { StackCompactIcon } from "@sanity/icons/StackCompact";
import { TagIcon } from "@sanity/icons/Tag";
import { TiersIcon } from "@sanity/icons/Tiers";
import { UserIcon } from "@sanity/icons/User";
import { UsersIcon } from "@sanity/icons/Users";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { GavelIcon, Megaphone, Settings2 } from "lucide-react";
import type { ComponentType } from "react";
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolverContext,
} from "sanity/structure";
import DocumentsPane from "sanity-plugin-documents-pane";

import { STORY_TYPES } from "@/house-rules/post";
import { HEALTH_CHECKS } from "@/plugins/health-checks";
import { API_VERSION } from "@/utils/constant";
import { ArticleCheck } from "@/views/article-check";

const NEWEST_FIRST = [{ field: "publishedAt", direction: "desc" as const }];
const NAME_ASC = [{ field: "name", direction: "asc" as const }];
const TITLE_ASC = [{ field: "title", direction: "asc" as const }];

type Ordering = Array<{ field: string; direction: "asc" | "desc" }>;

/** A document type's list, sorted alphabetically unless an editor re-sorts it. */
const sortedTypeList = (
  S: StructureBuilder,
  type: string,
  title: string,
  icon: ComponentType,
  ordering: Ordering = NAME_ASC,
) =>
  S.documentTypeListItem(type)
    .title(title)
    .icon(icon)
    .child(S.documentTypeList(type).title(title).defaultOrdering(ordering));

const referencesPane = (S: StructureBuilder, type: string, title: string) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == $type && references($id)] | order(coalesce(publishedAt, _createdAt) desc)`,
      params: { id: "_id", type },
      useDraft: false,
    })
    .title(title)
    .icon(LinkIcon);

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => {
  const form = S.view.form().icon(ComposeIcon);
  switch (schemaType) {
    case "post":
      return S.document().views([
        form,
        S.view
          .component(ArticleCheck)
          .title("Article check")
          .icon(CheckmarkCircleIcon),
        referencesPane(S, "post", "Linked from"),
      ]);
    case "author":
    case "school":
    case "tag":
    case "sport":
    case "sportSubgrouping":
    case "classification":
      return S.document().views([form, referencesPane(S, "post", "Articles")]);
    case "conference":
      return S.document().views([
        form,
        referencesPane(S, "post", "Articles"),
        referencesPane(S, "school", "Member schools"),
      ]);
    default:
      return S.document().views([form]);
  }
};

function storyList(
  S: StructureBuilder,
  options: {
    id: string;
    title: string;
    filter: string;
    params?: Record<string, unknown>;
    ordering?: Array<{ field: string; direction: "asc" | "desc" }>;
    templates?: Array<{ id: string; params?: Record<string, unknown> }>;
  },
) {
  const list = S.documentList()
    .id(options.id)
    .title(options.title)
    .schemaType("post")
    .menuItems(S.orderingMenuItemsForType("post"))
    .filter(`_type == "post" && (${options.filter})`)
    .apiVersion(API_VERSION)
    .params(options.params ?? {})
    .defaultOrdering(options.ordering ?? NEWEST_FIRST);

  return options.templates
    ? list.initialValueTemplates(
        options.templates.map((template) =>
          S.initialValueTemplateItem(template.id, template.params),
        ),
      )
    : list;
}

/**
 * Governing body → level → sport → subdivision → conference → schools.
 * Shows who is in "Mid-Major" or "FCS" the way the site resolves it: a school
 * inherits its conference's subdivision for a sport unless it has an override.
 */
function coverageMap(S: StructureBuilder, context: StructureResolverContext) {
  const client = context.getClient({ apiVersion: API_VERSION });

  const schoolsInConference = (conferenceId: string, sportId: string) =>
    S.documentList()
      .title("Member schools")
      .schemaType("school")
      .menuItems(S.orderingMenuItemsForType("school"))
      .filter(
        `_type == "school" && count(conferenceAffiliations[sport._ref == $sportId && conference._ref == $conferenceId]) > 0`,
      )
      .apiVersion(API_VERSION)
      .params({ conferenceId, sportId })
      .defaultOrdering(NAME_ASC);

  const conferenceNode = (conferenceId: string, sportId: string) =>
    S.list()
      .title("Conference")
      .items([
        S.listItem()
          .title("Member schools")
          .icon(HomeIcon)
          .child(schoolsInConference(conferenceId, sportId)),
        S.listItem()
          .title("Edit conference")
          .icon(EditIcon)
          .child(
            S.document().schemaType("conference").documentId(conferenceId),
          ),
      ]);

  const conferenceList = (
    title: string,
    filter: string,
    params: Record<string, unknown>,
    sportId: string,
  ) =>
    S.documentList()
      .title(title)
      .schemaType("conference")
      .menuItems(S.orderingMenuItemsForType("conference"))
      .filter(`_type == "conference" && ${filter}`)
      .apiVersion(API_VERSION)
      .params(params)
      .defaultOrdering(NAME_ASC)
      .child((conferenceId) => conferenceNode(conferenceId, sportId));

  const sportNode = async (classificationId: string, sportId: string) => {
    const subgroupings = await client.fetch<
      Array<{ _id: string; shortName?: string; name?: string; kind?: string }>
    >(
      `*[_type == "sportSubgrouping" && parentClassification._ref == $classificationId && $sportId in applicableSports[]._ref] | order(kind desc, shortName asc){_id, shortName, name, kind}`,
      { classificationId, sportId },
      // One row per subdivision: a draft replaces its published version
      // instead of appearing beside it.
      { perspective: "drafts" },
    );
    const base = { classificationId, sportId };

    if (subgroupings.length === 0) {
      return conferenceList(
        "Conferences",
        "primaryClassification._ref == $classificationId && $sportId in sports[]._ref",
        base,
        sportId,
      );
    }

    return S.list()
      .title("Subdivisions")
      .items([
        ...subgroupings.map((subgrouping) => {
          const title = subgrouping.shortName ?? subgrouping.name ?? "Untitled";
          const params = { ...base, subgroupingId: subgrouping._id };
          return S.listItem()
            .id(subgrouping._id)
            .title(
              subgrouping.kind === "common" ? `${title} (common usage)` : title,
            )
            .icon(SplitVerticalIcon)
            .child(
              S.list()
                .title(title)
                .items([
                  S.listItem()
                    .title("Conferences")
                    .icon(UsersIcon)
                    .child(
                      conferenceList(
                        `${title} conferences`,
                        "count(sportSubdivisionAffiliations[sport._ref == $sportId && subgrouping._ref == $subgroupingId]) > 0",
                        params,
                        sportId,
                      ),
                    ),
                  S.listItem()
                    .title("Schools placed here by override")
                    .icon(HomeIcon)
                    .child(
                      S.documentList()
                        .title(`${title} overrides`)
                        .schemaType("school")
                        .menuItems(S.orderingMenuItemsForType("school"))
                        .filter(
                          `_type == "school" && count(conferenceAffiliations[sport._ref == $sportId && subgroupingOverride._ref == $subgroupingId]) > 0`,
                        )
                        .apiVersion(API_VERSION)
                        .params(params)
                        .defaultOrdering(NAME_ASC),
                    ),
                  S.listItem()
                    .title("Edit definition")
                    .icon(EditIcon)
                    .child(
                      S.document()
                        .schemaType("sportSubgrouping")
                        .documentId(subgrouping._id),
                    ),
                ]),
            );
        }),
        S.divider(),
        S.listItem()
          .title("Conferences not placed yet")
          .icon(WarningOutlineIcon)
          .child(
            conferenceList(
              "Not placed",
              "primaryClassification._ref == $classificationId && $sportId in sports[]._ref && count(sportSubdivisionAffiliations[sport._ref == $sportId]) == 0",
              base,
              sportId,
            ),
          ),
      ]);
  };

  return S.listItem()
    .title("Division map")
    .icon(TiersIcon)
    .child(
      S.documentTypeList("governingBody")
        .title("Governing bodies")
        .defaultOrdering([{ field: "abbreviation", direction: "asc" }])
        .child((governingBodyId) =>
          S.documentList()
            .title("Divisions")
            .schemaType("classification")
            .menuItems(S.orderingMenuItemsForType("classification"))
            .filter(
              `_type == "classification" && governingBody._ref == $governingBodyId`,
            )
            .apiVersion(API_VERSION)
            .params({ governingBodyId })
            .defaultOrdering(NAME_ASC)
            .child((classificationId) =>
              S.documentTypeList("sport")
                .title("Sports")
                .defaultOrdering(TITLE_ASC)
                .child((sportId) => sportNode(classificationId, sportId)),
            ),
        ),
    );
}

export const structure = async (
  S: StructureBuilder,
  context: StructureResolverContext,
) => {
  const { currentUser, getClient } = context;
  const sports = await getClient({ apiVersion: API_VERSION }).fetch<
    Array<{ _id: string; title: string }>
  >(
    `*[_type == "sport"] | order(title asc){_id, title}`,
    {},
    { perspective: "drafts" },
  );

  const storyChecks = HEALTH_CHECKS.filter((check) => check.type === "post");
  const taxonomyChecks = HEALTH_CHECKS.filter((check) => check.type !== "post");

  const items = [
    S.divider().title("Newsroom"),
    // Title and icon come from `document.singletons` in sanity.config.ts.
    S.listItem().singleton("breakingNews"),
    sortedTypeList(S, "collection", "Collections", StackCompactIcon, TITLE_ASC),
    S.documentTypeListItem("post")
      .id("all-articles")
      .title("All articles")
      .icon(DocumentsIcon),
    S.listItem()
      .id("unpublished")
      .title("Not yet published")
      .icon(EditIcon)
      .child(
        storyList(S, {
          id: "unpublished",
          title: "Not yet published",
          filter: "!defined(publishedAt)",
          ordering: [{ field: "_updatedAt", direction: "desc" }],
        }),
      ),
    S.listItem()
      .id("published-this-week")
      .title("Published this week")
      .icon(CalendarIcon)
      .child(
        storyList(S, {
          id: "published-this-week",
          title: "Published this week",
          filter:
            "defined(publishedAt) && dateTime(publishedAt) > dateTime(now()) - 60*60*24*7",
        }),
      ),
    S.listItem()
      .id("by-type")
      .title("By article type")
      .icon(DocumentTextIcon)
      .child(
        S.list()
          .title("Article types")
          .items(
            STORY_TYPES.map((type) =>
              S.listItem()
                .id(`type-${type.value}`)
                .title(type.title)
                .icon(DocumentTextIcon)
                .child(
                  storyList(S, {
                    id: `type-${type.value}`,
                    title: type.title,
                    filter: "storyType == $storyType",
                    params: { storyType: type.value },
                    templates: [
                      {
                        id: "post-by-article-type",
                        params: { storyType: type.value },
                      },
                    ],
                  }),
                ),
            ),
          ),
      ),
    S.listItem()
      .id("by-sport")
      .title("By sport")
      .icon(ActivityIcon)
      .child(
        S.list()
          .title("Sports")
          .items(
            sports.map((sport) =>
              S.listItem()
                .id(`sport-${sport._id}`)
                .title(sport.title)
                .icon(ActivityIcon)
                .child(
                  storyList(S, {
                    id: `sport-${sport._id}`,
                    title: `${sport.title} articles`,
                    filter: "sport._ref == $sportId",
                    params: { sportId: sport._id },
                    templates: [
                      { id: "post-by-sport", params: { sportId: sport._id } },
                    ],
                  }),
                ),
            ),
          ),
      ),
    S.listItem()
      .id("needs-attention")
      .title("Needs attention")
      .icon(WarningOutlineIcon)
      .child(
        S.list()
          .title("Needs attention")
          .items([
            ...storyChecks.map((check) =>
              S.listItem()
                .id(check.id)
                .title(check.title)
                .icon(WarningOutlineIcon)
                .child(
                  S.documentList()
                    .id(check.id)
                    .title(check.title)
                    .schemaType(check.type)
                    .menuItems(S.orderingMenuItemsForType(check.type))
                    .filter(check.filter)
                    .apiVersion(API_VERSION)
                    .defaultOrdering(NEWEST_FIRST),
                ),
            ),
            S.divider(),
            ...taxonomyChecks.map((check) =>
              S.listItem()
                .id(check.id)
                .title(check.title)
                .icon(WarningOutlineIcon)
                .child(
                  S.documentList()
                    .id(check.id)
                    .title(check.title)
                    .schemaType(check.type)
                    .menuItems(S.orderingMenuItemsForType(check.type))
                    .filter(check.filter)
                    .apiVersion(API_VERSION)
                    .defaultOrdering(NAME_ASC),
                ),
            ),
          ]),
      ),

    S.divider().title("People"),
    S.listItem()
      .id("authors")
      .title("Authors")
      .icon(UserIcon)
      .child(
        S.documentList()
          .id("authors")
          .title("Authors")
          .schemaType("author")
          .menuItems(S.orderingMenuItemsForType("author"))
          .filter(`_type == "author" && archived != true`)
          .apiVersion(API_VERSION)
          .defaultOrdering(NAME_ASC),
      ),
    S.listItem()
      .id("authors-archived")
      .title("Former authors")
      .icon(UserIcon)
      .child(
        S.documentList()
          .id("authors-archived")
          .title("Former authors")
          .schemaType("author")
          .menuItems(S.orderingMenuItemsForType("author"))
          .filter(`_type == "author" && archived == true`)
          .apiVersion(API_VERSION)
          .defaultOrdering(NAME_ASC),
      ),

    S.divider().title("Teams & divisions"),
    coverageMap(S, context),
    sortedTypeList(S, "school", "Schools", HomeIcon),
    sortedTypeList(S, "conference", "Conferences", UsersIcon),
    sortedTypeList(S, "sport", "Sports", ActivityIcon, TITLE_ASC),
    S.listItem()
      .id("divisions-and-subdivisions")
      .title("Divisions & subdivisions")
      .icon(SplitVerticalIcon)
      .child(
        S.list()
          .title("Divisions & subdivisions")
          .items([
            sortedTypeList(
              S,
              "governingBody",
              "Governing bodies",
              EarthAmericasIcon,
              [{ field: "abbreviation", direction: "asc" }],
            ),
            sortedTypeList(S, "classification", "Divisions", TiersIcon),
            sortedTypeList(
              S,
              "sportSubgrouping",
              "Subdivisions",
              SplitVerticalIcon,
            ),
          ]),
      ),
    sortedTypeList(S, "tag", "Tags", TagIcon),
  ];

  if (currentUser?.roles?.find(({ name }) => name === "administrator")) {
    items.push(
      S.divider().title("Site"),
      sortedTypeList(S, "legal", "Legal documents", GavelIcon, TITLE_ASC),
      S.documentTypeListItem("redirect").title("Redirects").icon(RedoIcon),
      S.listItem()
        .id("site-configuration")
        .title("Site configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site configuration")
            .items([
              // Titles and icons come from `document.singletons` in sanity.config.ts.
              S.listItem().singleton("navbar"),
              S.listItem().singleton("footer"),
              S.listItem().singleton("settings"),
              sortedTypeList(S, "advertisement", "Sponsorships", Megaphone),
            ]),
        ),
    );
  }

  return S.list().title("Content").items(items);
};
