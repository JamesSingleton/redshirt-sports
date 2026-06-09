import { ComposeIcon, LinkIcon } from "@sanity/icons";
import {
  CogIcon,
  FileText,
  Folder,
  GavelIcon,
  Globe,
  GraduationCap,
  type LucideIcon,
  PanelBottomIcon,
  PanelTopDashedIcon,
  RefreshCcw,
  Settings2,
  TagIcon,
  UniversityIcon,
  User,
} from "lucide-react";
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolverContext,
} from "sanity/structure";
import DocumentsPane from "sanity-plugin-documents-pane";

import type { SchemaType, SingletonType } from "@/schemaTypes";
import { getTitleCase } from "@/utils/helper";

type Base<T = SchemaType> = {
  id?: string;
  type: T;
  preview?: boolean;
  title?: string;
  icon?: LucideIcon;
};

type CreateSingleTon = {
  S: StructureBuilder;
} & Base<SingletonType>;

const postReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == 'post' && references($id)] | order(_createdAt desc)`,
      params: { id: `_id` },
      useDraft: false,
    })
    .title("Post References")
    .icon(LinkIcon);

const schoolReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == 'school' && references($id)] | order(_createdAt desc)`,
      params: { id: `_id` },
      useDraft: false,
    })
    .title("School References")
    .icon(LinkIcon);

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => {
  switch (schemaType) {
    case "post":
      return S.document().views([
        S.view.form().icon(ComposeIcon),
        postReferences(S),
      ]);
    case "conference":
      return S.document().views([
        S.view.form().icon(ComposeIcon),
        postReferences(S),
        schoolReferences(S),
      ]);
    case "school":
      return S.document().views([
        S.view.form().icon(ComposeIcon),
        postReferences(S),
      ]);
    default:
      return S.document().views([S.view.form()]);
  }
};

const createSingleTon = ({ S, type, title, icon }: CreateSingleTon) => {
  const newTitle = title ?? getTitleCase(type);
  return S.listItem()
    .title(newTitle)
    .icon(icon ?? Folder)
    .child(S.document().schemaType(type).documentId(type));
};

type CreateList = {
  S: StructureBuilder;
} & Base;

const createList = ({ S, type, icon, title, id }: CreateList) => {
  const newTitle = title ?? getTitleCase(type);
  return S.documentTypeListItem(type)
    .id(id ?? type)
    .title(newTitle)
    .icon(icon ?? Folder);
};

const createStoryTypeFilteredList = (
  S: StructureBuilder,
  storyType: string,
  title: string,
) => {
  return S.listItem()
    .title(title)
    .icon(FileText)
    .id(`posts-${storyType}`)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == "post" && storyType == $storyType')
        .apiVersion("2025-06-11")
        .params({ storyType })
        .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
    );
};

const createSportFilteredList = (
  S: StructureBuilder,
  sportId: string,
  sportName: string,
) => {
  return S.listItem()
    .title(`${sportName} Articles`)
    .icon(FileText)
    .id(`${sportId}-articles`)
    .child(
      S.documentList()
        .title(`${sportName} Articles`)
        .filter('_type == "post" && sport._ref == $sportId')
        .apiVersion("2025-06-11")
        .params({ sportId })
        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        .initialValueTemplates([
          S.initialValueTemplateItem("post-by-sport", { sportId }),
        ]),
    );
};

const createWorkflowList = (
  S: StructureBuilder,
  id: string,
  title: string,
  filter: string,
  params?: Record<string, unknown>,
) => {
  return S.listItem()
    .title(title)
    .icon(FileText)
    .id(id)
    .child(
      S.documentList()
        .title(title)
        .schemaType("post")
        .filter(filter)
        .apiVersion("2025-06-11")
        .params(params ?? {})
        .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
    );
};

export const structure = async (
  S: StructureBuilder,
  context: StructureResolverContext,
) => {
  const { currentUser, getClient } = context;
  const client = getClient({ apiVersion: "2025-06-11" });
  const sports = await client.fetch<Array<{ _id: string; title: string }>>(
    `*[_type == 'sport'] | order(title asc) {
        _id,
        title
      }`,
  );

  const items = [
    S.divider().title("Editorial"),
    createList({
      S,
      type: "post",
      title: "All Articles",
      icon: FileText,
      id: "all-articles",
    }),
    createWorkflowList(
      S,
      "drafts",
      "Drafts",
      '_type == "post" && !defined(publishedAt)',
    ),
    createWorkflowList(
      S,
      "published-today",
      "Published Today",
      '_type == "post" && defined(publishedAt) && dateTime(publishedAt) > dateTime(now()) - 60*60*24',
    ),
    createStoryTypeFilteredList(S, "recruiting", "Recruiting"),
    createStoryTypeFilteredList(S, "transfer", "Transfer Portal"),
    S.listItem()
      .title("Analysis & Opinion")
      .icon(FileText)
      .id("posts-analysis-opinion")
      .child(
        S.documentList()
          .title("Analysis & Opinion")
          .filter('_type == "post" && storyType in ["analysis", "opinion"]')
          .apiVersion("2025-06-11")
          .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
      ),
    ...sports.map((sport) =>
      createSportFilteredList(S, sport._id, sport.title),
    ),
    S.divider().title("People"),
    createList({ S, type: "author", title: "Authors", icon: User }),
    S.divider().title("Teams & Taxonomy"),

    createList({
      S,
      type: "school",
      title: "Schools",
      icon: UniversityIcon,
    }).child(
      S.documentTypeList("school")
        .title("Schools")
        .defaultOrdering([{ field: "name", direction: "asc" }]),
    ),
    createList({ S, type: "sport", title: "Sports" }),
    createList({
      S,
      type: "governingBody",
      title: "Governing Bodies",
    }),
    createList({
      S,
      type: "classification",
      title: "Classifications",
    }),
    createList({ S, type: "division", title: "Divisions" }),
    createList({ S, type: "conference", title: "Conferences" }).child(
      S.documentTypeList("conference")
        .title("Conferences")
        .defaultOrdering([{ field: "name", direction: "asc" }]),
    ),
    createList({
      S,
      type: "sportSubgrouping",
      title: "Sport Subgroupings",
    }),
    S.divider().title("Labeling"),
    createList({
      S,
      type: "tag",
      title: "Tags",
      icon: TagIcon,
    }),
  ];

  if (currentUser?.roles?.find(({ name }) => name === "administrator")) {
    items.push(S.divider().title("Site"));
    items.push(
      createList({
        S,
        type: "legal",
        title: "Legal Documents",
        icon: GavelIcon,
      }),
    );
    items.push(
      createList({ S, type: "redirect", title: "Redirects", icon: RefreshCcw }),
    );
    items.push(
      S.listItem()
        .title("Site Configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site Configuration")
            .items([
              createSingleTon({
                S,
                type: "navbar",
                title: "Navigation",
                icon: PanelTopDashedIcon,
              }),
              createSingleTon({
                S,
                type: "footer",
                title: "Footer",
                icon: PanelBottomIcon,
              }),
              createSingleTon({
                S,
                type: "settings",
                title: "Global Settings",
                icon: CogIcon,
              }),
            ]),
        ),
    );
  }

  return S.list().title("Content").items(items);
};
