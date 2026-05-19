import { defineField } from "sanity";

import { PathnameFieldComponent } from "@/components/slug-field-component";
import {
  createSlugErrorValidator,
  createSlugWarningValidator,
  getDocumentTypeConfig,
} from "@/utils/slug-validation";

export const richTextField = defineField({
  name: "richText",
  type: "richText",
});

export const documentSlugField = (
  documentType: string,
  options: {
    group?: string;
    description?: string;
    title?: string;
  } = {},
) => {
  const {
    group,
    description = `The web address where people can find your ${documentType} (automatically created from title)`,
    title = "URL",
  } = options;

  return defineField({
    name: "slug",
    type: "slug",
    title,
    description,
    group,
    components: {
      field: PathnameFieldComponent,
    },
    validation: (rule) => {
      const config = getDocumentTypeConfig(documentType);
      return [
        rule.custom(createSlugErrorValidator(config)),
        rule.custom(createSlugWarningValidator(config)).warning(),
      ];
    },
  });
};
