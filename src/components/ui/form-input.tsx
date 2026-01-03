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
import { Input, type InputProps } from "./input";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

interface Props<T extends FieldValues> extends Omit<InputProps, "name"> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
}

const FormInput = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  ...inputProps
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
          <Input {...field} {...inputProps} />
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormInput) as typeof FormInput;
