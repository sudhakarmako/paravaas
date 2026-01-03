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
import { Checkbox } from "./checkbox";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

interface Props<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Checkbox>,
  "checked" | "onCheckedChange"
> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
}

const FormCheckbox = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  ...checkboxProps
}: Props<T>) => (
  <FormField
    control={control}
    name={name}
    render={({ field }: { field: ControllerRenderProps<T, Path<T>> }) => (
      <FormItem>
        <FormControl>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.value as boolean | undefined}
              onCheckedChange={field.onChange}
              {...checkboxProps}
            />
            {label && (
              <FormLabel className="cursor-pointer font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
                {required && <span className="text-red-500">*</span>}
              </FormLabel>
            )}
          </div>
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormCheckbox) as typeof FormCheckbox;
