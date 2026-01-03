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
import { RadioGroup, RadioGroupItem } from "./radio-group";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { cn } from "@/core/lib/utils";

interface FormRadioOption {
  value: string;
  label: string;
}

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
  options: FormRadioOption[];
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
}

const FormRadio = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  options,
  disabled,
  orientation = "vertical",
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
          <RadioGroup
            value={field.value as string | undefined}
            onValueChange={field.onChange}
            disabled={disabled}
            className={cn(orientation === "horizontal" && "flex-row gap-6")}
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${name}-${option.value}`}
                />
                <FormLabel
                  htmlFor={`${name}-${option.value}`}
                  className="cursor-pointer font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </FormLabel>
              </div>
            ))}
          </RadioGroup>
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormRadio) as typeof FormRadio;
