"use client";

import { memo, useState } from "react";
import * as Icons from "lucide-react";
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
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { cn } from "@/core/lib/utils";

// Common lucide icons for projects
const iconNames = [
  "Folder",
  "FolderOpen",
  "Briefcase",
  "Rocket",
  "Code",
  "Database",
  "Server",
  "Globe",
  "Zap",
  "Target",
  "TrendingUp",
  "BarChart",
  "PieChart",
  "ShoppingCart",
  "Users",
  "User",
  "Mail",
  "MessageSquare",
  "Calendar",
  "Clock",
  "Star",
  "Heart",
  "Bookmark",
  "FileText",
  "Image",
  "Video",
  "Music",
  "Settings",
  "Wrench",
  "Key",
  "Lock",
  "Unlock",
  "Shield",
  "Bell",
  "Home",
  "Building",
  "Map",
  "Navigation",
  "Compass",
  "Flag",
  "Award",
  "Trophy",
  "Gift",
  "Package",
  "Box",
  "Archive",
  "Layers",
  "Grid",
  "Layout",
  "Monitor",
  "Smartphone",
  "Tablet",
  "Camera",
  "Mic",
  "Headphones",
  "Gamepad",
  "Dice",
  "Puzzle",
  "Lightbulb",
  "Flame",
  "Droplet",
  "Sun",
  "Moon",
  "Cloud",
  "Wind",
  "Leaf",
  "Tree",
  "Flower",
  "Coffee",
  "Utensils",
  "Car",
  "Bike",
  "Plane",
  "Ship",
  "Train",
  "Bus",
  "Wallet",
  "CreditCard",
  "DollarSign",
  "Euro",
  "Pound",
  "Yen",
  "Bitcoin",
  "Activity",
  "Pulse",
  "Heartbeat",
  "Thermometer",
  "Gauge",
  "GaugeCircle",
  "LineChart",
  "AreaChart",
] as const;

type IconName = (typeof iconNames)[number];

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  colorName: Path<T>;
  label?: string;
  required?: boolean;
  caption?: string;
}

const FormIcon = <T extends FieldValues>({
  required = false,
  control,
  name,
  colorName,
  label,
  caption,
}: Props<T>) => {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Common color palette
  const colors = [
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#EF4444", // red
    "#F59E0B", // amber
    "#10B981", // emerald
    "#14B8A6", // teal
    "#06B6D4", // cyan
    "#6366F1", // indigo
    "#F97316", // orange
    "#84CC16", // lime
    "#22C55E", // green
  ];

  return (
    <div className="space-y-4">
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
              <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {field.value ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const iconName = field.value as string;
                          const IconComponent =
                            (Icons[iconName as keyof typeof Icons] as
                              | React.ComponentType<{ className?: string }>
                              | undefined) || Icons.Folder;
                          return <IconComponent className="size-4" />;
                        })()}
                        <span className="capitalize">{field.value}</span>
                      </div>
                    ) : (
                      <>
                        <Icons.Folder className="size-4" />
                        Select icon
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search icons..." />
                    <CommandList>
                      <CommandEmpty>No icon found.</CommandEmpty>
                      <CommandGroup>
                        <div className="grid grid-cols-6 gap-2 p-2">
                          {iconNames.map((iconName) => {
                            const IconComponent =
                              (Icons[
                                iconName as keyof typeof Icons
                              ] as React.ComponentType<{
                                className?: string;
                              }>) || Icons.Folder;
                            const isSelected = field.value === iconName;
                            return (
                              <CommandItem
                                key={iconName}
                                value={iconName}
                                onSelect={() => {
                                  field.onChange(iconName);
                                  setIconPickerOpen(false);
                                }}
                                className="p-0"
                              >
                                <Button
                                  type="button"
                                  variant={isSelected ? "default" : "ghost"}
                                  size="icon"
                                  className={cn(
                                    "size-10",
                                    isSelected &&
                                      "bg-primary text-primary-foreground"
                                  )}
                                >
                                  <IconComponent className="size-5" />
                                </Button>
                              </CommandItem>
                            );
                          })}
                        </div>
                      </CommandGroup>
                    </CommandList>
                  </Command>
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

      <FormField
        control={control}
        name={colorName}
        render={({ field }: { field: ControllerRenderProps<T, Path<T>> }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-4 rounded"
                        style={{
                          backgroundColor: field.value || colors[0],
                        }}
                      />
                      <span>{field.value || colors[0]}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-3" align="start">
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          field.onChange(color);
                          setColorPickerOpen(false);
                        }}
                        className={cn(
                          "size-8 rounded-md border-2 transition-all hover:scale-110",
                          field.value === color
                            ? "border-foreground ring-2 ring-ring"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Custom Color
                    </label>
                    <input
                      type="color"
                      value={field.value || colors[0]}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default memo(FormIcon) as typeof FormIcon;
