"use client";

import { memo } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Textarea, type TextareaProps } from "./textarea";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

interface Props<T extends FieldValues> extends Omit<TextareaProps, "name"> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
}

const FormTextarea = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  ...textareaProps
}: Props<T>) => (
  <FormField
    control={control}
    name={name}
    render={({ field }: { field: ControllerRenderProps<T, Path<T>> }) => (
      <FormItem>
        {label && (
          <FormLabel>
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
        )}
        <FormControl>
          <Textarea {...field} {...textareaProps} />
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormTextarea) as typeof FormTextarea;
