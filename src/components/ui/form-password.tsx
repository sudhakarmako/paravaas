"use client";

import { useState, memo } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { InputProps } from "./input";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";

interface Props<T extends FieldValues> extends Omit<
  InputProps,
  "name" | "type"
> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
}

const FormPassword = <T extends FieldValues>({
  required = false,
  control,
  name,
  label,
  caption,
  ...inputProps
}: Props<T>) => {
  const [show, setShow] = useState(false);

  return (
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
            <Input
              {...field}
              {...inputProps}
              type={show ? "text" : "password"}
              rightElement={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShow((prev) => !prev)}
                >
                  {show ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </Button>
              }
              rightElementClassName="right-1"
            />
          </FormControl>
          {caption && (
            <FormDescription className="text-xs">{caption}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default memo(FormPassword) as typeof FormPassword;
