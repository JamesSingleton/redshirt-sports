import type { ComponentType } from "react";
import {
  defineField,
  type ObjectFieldProps,
  type SlugOptions,
  type SlugValue,
} from "sanity";

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
    component?: ComponentType<ObjectFieldProps<SlugValue>>;
    slugOptions?: SlugOptions;
    required?: boolean;
  } = {},
) => {
  const {
    group,
    description = `The web address where people can find your ${documentType} (automatically created from title)`,
    title = "URL",
    component = PathnameFieldComponent,
    slugOptions,
    required = false,
  } = options;

  const config = getDocumentTypeConfig(documentType);

  return defineField({
    name: "slug",
    type: "slug",
    title,
    description,
    group,
    ...(slugOptions ? { options: slugOptions } : {}),
    components: {
      field: component,
    },
    validation: (Rule) => {
      const validators = [
        Rule.custom(createSlugErrorValidator(config)),
        Rule.custom(createSlugWarningValidator(config)).warning(),
      ];

      return required ? [Rule.required(), ...validators] : validators;
    },
  });
};
