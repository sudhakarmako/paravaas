"use client";

import { memo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { cn } from "@/core/lib/utils";

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
  placeholder?: string;
  disabled?: boolean;
}

const FormDate = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  placeholder = "Pick a date",
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(field.value as Date, "PPP")
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date | undefined}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormControl>
        {caption && (
          <FormDescription className="text-xs">{caption}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default memo(FormDate) as typeof FormDate;
