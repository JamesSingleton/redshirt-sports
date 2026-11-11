import {
  type BlockRule,
  isPortableTextSpan,
  isPortableTextTextBlock,
  type Path,
  type PortableTextSpan,
} from "sanity";

export interface ForbiddenLocationPTE {
  matchText?: string;
  message: string;
  offset: number;
  path: Path;
  span: PortableTextSpan;
  level: "error" | "info" | "warning";
}

//  * * Inline level validations for Portable Text * *

// * Warnings
/** ## Validation on text block level:
 *
 * Warn when block is all bold -> Suggestion to make it a heading instead
 *
 * Warn when heading is all bold -> Suggestion to remove strong
 *
 */
export const warnWhenHeadingOrBlockIsAllBold = (Rule: BlockRule) =>
  Rule.warning().custom((value, context) => {
    const { path } = context;
    const locations: ForbiddenLocationPTE[] = [];
    // * Validate if whole block is styled as strong
    if (path && isPortableTextTextBlock(value)) {
      // check if the block has only one child and if it is a span
      const hasOneChild = value.children.length === 1;
      const childIsSpan = hasOneChild
        ? isPortableTextSpan(value.children[0])
        : false;
      // check if block is heading
      const isHeading = value.style?.startsWith("h");

      const child = childIsSpan
        ? (value.children[0] as PortableTextSpan)
        : undefined;
      // check if the child is styled as strong
      const strong = child?.marks?.some((mark) => mark === "strong");

      // if the block is styled as strong and the child is a span, add a warning
      if (strong && childIsSpan && !isHeading) {
        locations.push({
          span: value.children[0] as PortableTextSpan,
          matchText: "",
          path: path.concat(["children", { _key: value._key }]),
          offset: 0,
          message: "Did you want to make this a heading?",
          level: "warning",
        });
      }

      // if block is heading and strong, warn to remove strong
      if (strong && childIsSpan && isHeading) {
        locations.push({
          span: value.children[0] as PortableTextSpan,
          matchText: "",
          path: path.concat(["children", { _key: value._key }]),
          offset: 0,
          message: "Headings should not be styled as strong.",
          level: "warning",
        });
      }
    }

    if (locations.length) {
      return {
        message: `${locations.map((item) => item.message).join(". ")}`,
      };
    }
    return true;
  });
