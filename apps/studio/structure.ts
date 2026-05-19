import {
  CheckmarkCircleIcon,
  ClockIcon,
  ComposeIcon,
  EditIcon,
  LinkIcon,
  PublishIcon,
} from "@sanity/icons";
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
        // Publishing checklist gives writers a single-glance readiness check
        // without digging through validation errors.
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

// ─── Sport-Filtered Article Lists ─────────────────────────────────────────────

const createSportFilteredList = (
  S: StructureBuilder,
  sportId: string,
  sportName: string,
) => {
  return S.listItem()
    .title(`${sportName}`)
    .icon(FileText)
    .id(`${sportId}-articles`)
    .child(
      S.documentList()
        .title(`${sportName} Articles`)
        .filter('_type == "post" && sport._ref == $sportId')
        .apiVersion("2025-06-11")
        .params({ sportId })
        .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
        .initialValueTemplates([
          S.initialValueTemplateItem("post-by-sport", { sportId }),
        ]),
    );
};

// ─── Workflow Panes ────────────────────────────────────────────────────────────
//
// These filtered lists are what makes Sanity feel like a real editorial CMS.
// Editors can move straight from "In Review" to "Ready to Publish" without
// hunting through all articles.
//

const workflowPane = (
  S: StructureBuilder,
  title: string,
  status: string,
  icon: any,
  id: string,
) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .id(id)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == "post" && status == $status')
        .apiVersion("2025-06-11")
        .params({ status })
        .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
    );

// ─── Main Structure ────────────────────────────────────────────────────────────

export const structure = async (
  S: StructureBuilder,
  context: StructureResolverContext,
) => {
  const { currentUser, getClient } = context;
  const client = getClient({ apiVersion: "2025-06-11" });

  const sports = await client.fetch<Array<{ _id: string; title: string }>>(
    `*[_type == 'sport'] | order(title asc) { _id, title }`,
  );

  const items = [
    // ── All Articles + by Sport ─────────────────────────────────────────────
    S.divider().title("Articles"),
    createList({
      S,
      type: "post",
      title: "All Articles",
      icon: FileText,
      id: "all-articles",
    }),
    S.listItem()
      .title("By Sport")
      .icon(Folder)
      .id("articles-by-sport")
      .child(
        S.list()
          .title("Articles by Sport")
          .items(
            sports.map((sport) =>
              createSportFilteredList(S, sport._id, sport.title),
            ),
          ),
      ),

    // ── Sports Organizational Structure ────────────────────────────────────
    S.divider().title("Sports Structure"),
    createList({ S, type: "sport", title: "Sports" }),
    createList({ S, type: "governingBody", title: "Governing Bodies" }),
    createList({ S, type: "classification", title: "Classifications" }),
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
      type: "sportSubgrouping",
      title: "Sport Subdivision / Subgrouping",
    }),

    // ── Labeling ───────────────────────────────────────────────────────────
    S.divider().title("Labeling"),
    createList({ S, type: "tag", title: "Tags", icon: TagIcon }),

    // ── Team ───────────────────────────────────────────────────────────────
    S.divider().title("Team"),
    createList({ S, type: "author", title: "Authors", icon: User }),
  ];

  // ── Admin-only ─────────────────────────────────────────────────────────────
  if (currentUser?.roles?.find(({ name }) => name === "administrator")) {
    items.push(S.divider().title("Admin"));
    items.push(
      createList({
        S,
        type: "legal",
        title: "Legal Documents",
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
