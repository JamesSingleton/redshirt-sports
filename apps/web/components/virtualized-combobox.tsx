"use client";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@redshirt-sports/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import CustomImage from "@/components/sanity-image";

type SchoolOption = SchoolsBySportAndSubgroupingStringQueryResult[number];

function normalizeSchoolText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function schoolMatchesQuery(option: SchoolOption, query: string) {
  const normalizedQuery = normalizeSchoolText(query);
  if (!normalizedQuery) {
    return true;
  }

  return [option.name, option.shortName, option.abbreviation].some((value) =>
    normalizeSchoolText(value).includes(normalizedQuery),
  );
}

function compareSchoolMatches(a: SchoolOption, b: SchoolOption, query: string) {
  const normalizedQuery = normalizeSchoolText(query);
  const aHasPrefix = [a.name, a.shortName, a.abbreviation].some((value) =>
    normalizeSchoolText(value).startsWith(normalizedQuery),
  );
  const bHasPrefix = [b.name, b.shortName, b.abbreviation].some((value) =>
    normalizeSchoolText(value).startsWith(normalizedQuery),
  );

  if (aHasPrefix !== bHasPrefix) {
    return aHasPrefix ? -1 : 1;
  }

  return (a.shortName ?? a.name).localeCompare(b.shortName ?? b.name);
}

interface VirtualizedCommandProps {
  height: string;
  options: SchoolsBySportAndSubgroupingStringQueryResult;
  placeholder: string;
  selectedOption: string;
  selectedOptions: string[];
  onSelectOption?: (option: string) => void;
}

const VirtualizedCommand = ({
  height,
  options,
  placeholder,
  selectedOption,
  selectedOptions,
  onSelectOption,
}: VirtualizedCommandProps) => {
  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedOptions.includes(option._id)),
    [options, selectedOptions],
  );

  const [searchValue, setSearchValue] = React.useState("");
  const parentRef = React.useRef(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) {
      return availableOptions;
    }

    return availableOptions
      .filter((option) => schoolMatchesQuery(option, searchValue))
      .sort((a, b) => compareSchoolMatches(a, b, searchValue));
  }, [availableOptions, searchValue]);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const virtualOptions = virtualizer.getVirtualItems();

  return (
    <Command shouldFilter={false}>
      <CommandInput onValueChange={setSearchValue} placeholder={placeholder} />
      <CommandList className="max-h-fit">
        <CommandEmpty>No school found.</CommandEmpty>
        <CommandGroup
          ref={parentRef}
          style={{
            height: height,
            width: "100%",
            overflow: "auto",
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualOptions.map((virtualOption) => {
              const option = filteredOptions[virtualOption.index];
              if (!option) {
                return null;
              }

              return (
                <CommandItem
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualOption.size}px`,
                    transform: `translateY(${virtualOption.start}px)`,
                  }}
                  key={option._id}
                  value={option._id}
                  onSelect={onSelectOption}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selectedOption === option._id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex items-center">
                    <CustomImage
                      image={option.image}
                      width={32}
                      height={32}
                      className="mr-2 size-8"
                    />
                    {option.shortName}
                  </div>
                </CommandItem>
              );
            })}
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

interface VirtualizedComboboxProps {
  options: SchoolsBySportAndSubgroupingStringQueryResult;
  searchPlaceholder?: string;
  width?: string;
  height?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedOptions: string[];
}

export function VirtualizedCombobox({
  options,
  searchPlaceholder = "Select a school...",
  // width = '350px',
  height = "400px",
  value,
  onChange,
  selectedOptions,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [selectedOption, setSelectedOption] = React.useState<string>(
    value || "",
  );
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(
    undefined,
  );

  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedOptions.includes(option._id)),
    [options, selectedOptions],
  );

  const selectedSchool = React.useMemo(
    () => options.find((option) => option._id === selectedOption),
    [options, selectedOption],
  );

  // Sync internal state with external value
  React.useEffect(() => {
    setSelectedOption(value || "");
  }, [value]);

  // Update trigger width when popover opens
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const handleSelectOption = React.useCallback(
    (currentValue: string) => {
      const newValue = currentValue === selectedOption ? "" : currentValue;
      setSelectedOption(newValue);
      onChange?.(newValue);
      setOpen(false);
    },
    [selectedOption, onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedSchool?.image ? (
            <span className="inline-flex items-center">
              <CustomImage
                image={selectedSchool.image}
                width={32}
                height={32}
                className="mr-2 size-8"
              />
              {selectedSchool.shortName}
            </span>
          ) : (
            searchPlaceholder
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: triggerWidth ? `${triggerWidth}px` : "100%" }}
      >
        <VirtualizedCommand
          height={height}
          options={availableOptions}
          placeholder={searchPlaceholder}
          selectedOption={selectedOption}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
        />
      </PopoverContent>
    </Popover>
  );
}
