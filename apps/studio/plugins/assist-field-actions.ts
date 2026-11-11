import {
  type AssistFieldActionProps,
  defineAssistFieldAction,
} from "@sanity/assist";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { useMemo } from "react";
import { useClient } from "sanity";

import { LIMITS, SITE_NAME } from "@/house-rules/limits";

/**
 * AI Assist buttons on article fields, with the house rules written into the
 * instruction so the draft passes validation. The writer reviews and edits
 * the result; nothing publishes on its own.
 */

const INSTRUCTIONS: Record<string, { title: string; instruction: string }> = {
  seoTitle: {
    title: "Write SEO title",
    instruction: `Rewrite the headline $title as a search result title of at most ${LIMITS.seoTitle.max} characters. Keep the team or person and what happened; drop secondary detail. Title Case. Do not include "${SITE_NAME}", quotation marks, or a trailing period.`,
  },
  excerpt: {
    title: "Write summary",
    instruction: `Using $body, write a summary of ${LIMITS.excerpt.idealMin} to ${LIMITS.excerpt.idealMax} characters for the line under the headline $title on article cards and in search results. One or two sentences, plain language. Name the team or person and say what happened or why it matters. Do not repeat the headline word for word. No hashtags, emoji, or quotation marks.`,
  },
  keyTakeaways: {
    title: "Draft key takeaways",
    instruction: `Using $body, write three facts a reader should leave with, most important first. Each is one sentence of ${LIMITS.keyTakeaways.itemMin} to ${LIMITS.keyTakeaways.itemMax} characters, states a specific fact from the article (names, numbers, results), and does not repeat another.`,
  },
};

const fieldName = (path: AssistFieldActionProps["path"]) =>
  path.length === 1 && typeof path[0] === "string" ? path[0] : undefined;

export function useArticleFieldActions(props: AssistFieldActionProps) {
  const client = useClient({ apiVersion: "vX" });
  const {
    actionType,
    documentIdForAction,
    documentSchemaType,
    getDocumentValue,
    path,
    schemaId,
  } = props;
  const field = fieldName(path);
  const config =
    actionType === "field" &&
    documentSchemaType.name === "post" &&
    field !== undefined
      ? INSTRUCTIONS[field]
      : undefined;

  return useMemo(() => {
    if (!config) return [];
    return [
      defineAssistFieldAction({
        title: config.title,
        icon: SparklesIcon,
        onAction: async () => {
          await client.agent.action.generate({
            schemaId,
            targetDocument: {
              operation: "createIfNotExists",
              _id: documentIdForAction,
              _type: documentSchemaType.name,
              initialValues: getDocumentValue(),
            },
            instruction: config.instruction,
            instructionParams: {
              title: { type: "field", path: "title" },
              body: { type: "field", path: "body" },
            },
            target: { path },
          });
        },
      }),
    ];
  }, [
    client,
    config,
    documentIdForAction,
    documentSchemaType.name,
    getDocumentValue,
    path,
    schemaId,
  ]);
}
