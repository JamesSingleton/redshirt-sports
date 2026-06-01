import { CheckmarkCircleIcon, ComposeIcon, LinkIcon } from "@sanity/icons";
import {
  CogIcon,
  FileText,
  Folder,
  GavelIcon,
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

import { PublishingChecklistView } from "./components/publishing-checklist";
import type { SchemaType, SingletonType } from "./schemaTypes";
import { getTitleCase } from "./utils/helper";

const API_VERSION = "2025-06-11";

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

// ─── Shared Reference Panes ───────────────────────────────────────────────────

const postReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == 'post' && references($id)] | order(publishedAt desc)`,
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

// ─── Default Document Node ─────────────────────────────────────────────────

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => {
  switch (schemaType) {
    case "post":
      return S.document().views([
        S.view.form().icon(ComposeIcon).title("Edit"),
        S.view
          .component(PublishingChecklistView)
          .title("Publishing Checklist")
          .icon(CheckmarkCircleIcon),
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const defaultPostTemplates = (S: StructureBuilder) => [
  S.initialValueTemplateItem("post-college-wide"),
  S.initialValueTemplateItem("post-recruiting"),
  S.initialValueTemplateItem("post-transfer"),
  S.initialValueTemplateItem("post-analysis"),
  S.initialValueTemplateItem("post-opinion"),
  S.initialValueTemplateItem("post-podcast-notes"),
];

type PostListOptions = {
  id: string;
  title: string;
  filter: string;
  params?: Record<string, unknown>;
  templates?: ReturnType<typeof defaultPostTemplates>;
};

const createPostList = (
  S: StructureBuilder,
  { id, title, filter, params, templates }: PostListOptions,
) =>
  S.listItem()
    .title(title)
    .icon(FileText)
    .id(id)
    .child(
      S.documentList()
        .title(title)
        .schemaType("post")
        .filter(filter)
        .apiVersion(API_VERSION)
        .params(params ?? {})
        .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
        .initialValueTemplates(templates ?? defaultPostTemplates(S)),
    );

const createSportFilteredList = (
  S: StructureBuilder,
  sportId: string,
  sportName: string,
) =>
  S.listItem()
    .title(sportName)
    .icon(FileText)
    .id(`${sportId}-articles`)
    .child(
      S.documentList()
        .title(`${sportName} Articles`)
        .schemaType("post")
        .filter('_type == "post" && sport._ref == $sportId')
        .apiVersion(API_VERSION)
        .params({ sportId })
        .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
        .initialValueTemplates([
          S.initialValueTemplateItem("post-by-sport", { sportId }),
          S.initialValueTemplateItem("post-game-recap", { sportId }),
          ...defaultPostTemplates(S),
        ]),
    );

// ─── Main Structure ────────────────────────────────────────────────────────────

export const structure = async (
  S: StructureBuilder,
  context: StructureResolverContext,
) => {
  const { currentUser, getClient } = context;
  const client = getClient({ apiVersion: API_VERSION });

  const sports = await client.fetch<Array<{ _id: string; title: string }>>(
    `*[_type == 'sport'] | order(title asc) { _id, title }`,
  );

  const items = [
    S.divider().title("Newsroom"),

    // Articles
    createPostList(S, {
      id: "newsroom-all-articles",
      title: "All articles",
      filter: '_type == "post"',
    }),
    S.listItem()
      .title("By sport")
      .icon(Folder)
      .id("newsroom-by-sport")
      .child(
        S.list()
          .title("By sport")
          .items(
            sports.map((sport) =>
              createSportFilteredList(S, sport._id, sport.title),
            ),
          ),
      ),

    S.divider().title("Sports Structure"),
    createList({ S, type: "sport", title: "Sports" }),
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
    createList({
      S,
      type: "conference",
      title: "Conferences",
    }).child(
      S.documentTypeList("conference")
        .title("Conferences")
        .defaultOrdering([{ field: "name", direction: "asc" }]),
    ),
    createList({
      S,
      type: "sportSubgrouping",
      title: "FBS, FCS & groupings",
    }),
    createList({
      S,
      type: "classification",
      title: "Competition levels",
    }),
    createList({
      S,
      type: "governingBody",
      title: "Associations (NCAA, NAIA…)",
    }),
    createList({ S, type: "tag", title: "Tags", icon: TagIcon }),
    createList({ S, type: "author", title: "Authors", icon: User }),
  ];

  if (currentUser?.roles?.find(({ name }) => name === "administrator")) {
    items.push(S.divider().title("Admin"));
    items.push(
      createList({
        S,
        type: "legal",
        title: "Legal documents",
        icon: GavelIcon,
      }),
    );
    items.push(
      createList({
        S,
        type: "redirect",
        title: "Redirects",
        icon: RefreshCcw,
      }),
    );
    items.push(
      S.listItem()
        .title("Site configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site configuration")
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
                title: "Global settings",
                icon: CogIcon,
              }),
            ]),
        ),
    );
  }

  return S.list().title("Content").items(items);
};
