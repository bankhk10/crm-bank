"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues
} from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormFieldContext = React.createContext<{ name: string } | undefined>(undefined);

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};
FormField.displayName = "FormField";

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  const id = itemContext?.id;

  return {
    id,
    name: fieldContext.name,
    formItemId: id ? `${id}-form-item` : undefined,
    formDescriptionId: id ? `${id}-form-item-description` : undefined,
    formMessageId: id ? `${id}-form-item-message` : undefined,
    ...fieldState
  };
};

const FormItemContext = React.createContext<{ id: string } | undefined>(undefined);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, React.HTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => {
  const { formItemId } = useFormField();
  return <label ref={ref} className={cn("text-sm font-medium leading-none", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ className, ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      ref={ref}
      className={cn(className)}
      aria-describedby={[formDescriptionId, formMessageId].filter(Boolean).join(" ")}
      aria-invalid={!!formMessageId}
      id={formItemId}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();
    return <p ref={ref} className={cn("text-xs text-slate-500", className)} id={formDescriptionId} {...props} />;
  }
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} className={cn("text-xs font-medium text-red-600", className)} id={formMessageId} {...props}>
        {body}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
