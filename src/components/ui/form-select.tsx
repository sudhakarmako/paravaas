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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

interface FormSelectOption {
  value: string;
  label: string;
}

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
  placeholder?: string;
  options: FormSelectOption[];
  disabled?: boolean;
}

const FormSelect = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  placeholder = "Select an option",
  options,
  disabled,
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
          <Select
            value={field.value as string | undefined}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormSelect) as typeof FormSelect;
