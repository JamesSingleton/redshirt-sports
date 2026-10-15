import { reservedRootSegment } from "@redshirt-sports/seo/reserved-paths";
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
    /** Reject root segments owned by the public route map. */
    rejectReserved?: boolean;
  } = {},
) => {
  const {
    group,
    description = `The web address where people can find your ${documentType} (automatically created from title)`,
    title = "URL",
    component = PathnameFieldComponent,
    slugOptions,
    required = false,
    rejectReserved = false,
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

      if (rejectReserved) {
        validators.push(
          Rule.custom((value) => {
            const current = (value as { current?: string } | undefined)
              ?.current;
            if (!current) return true;
            const reserved = reservedRootSegment(current);
            return reserved ? `"${reserved}" is a reserved path` : true;
          }),
        );
      }

      return required ? [Rule.required(), ...validators] : validators;
    },
  });
};
