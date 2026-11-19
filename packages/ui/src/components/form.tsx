"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as FieldPrimitive,
} from "@ui-sdk/react/field";
import { type ComponentProps, createContext, useContext } from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from "react-hook-form";

const Form = FormProvider;

const FormFieldContext = createContext<{ name: string } | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: context.name });
  return { name: context.name, ...getFieldState(context.name, formState) };
}

function FormItem({
  className,
  ...props
}: WithClassName<ComponentProps<typeof FieldPrimitive>>) {
  const { name, error } = useFormField();
  return (
    <FieldPrimitive
      name={name}
      invalid={error ? true : undefined}
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function FormLabel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof FieldLabel>>) {
  return (
    <FieldLabel
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none data-disabled:opacity-50 data-invalid:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: WithClassName<ComponentProps<typeof FieldDescription>>) {
  return (
    <FieldDescription
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  children,
  ...props
}: WithClassName<Omit<ComponentProps<typeof FieldError>, "children">> & {
  children?: string;
}) {
  const { error } = useFormField();
  const message = error?.message ? String(error.message) : children;
  if (!message) return null;
  return (
    <FieldError
      match
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {message}
    </FieldError>
  );
}

export {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
