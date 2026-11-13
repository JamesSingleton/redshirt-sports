"use client";

import { PLAYER_CLASSES } from "@redshirt-sports/db/portal";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
import { Label } from "@redshirt-sports/ui/components/label";
import { useId } from "react";

import type { PortalDesk } from "@/actions/portal";
import {
  defaultCycleYear,
  EMPTY_SCHOOL,
  EMPTY_SOURCE,
  localNow,
  localToIso,
  OptionSelect,
  positionOptions,
  SchoolPicker,
  type SchoolValue,
  SourceFields,
  type SourceValue,
  sourcePayload,
  TextField,
} from "@/components/portal/fields";

type Sport = PortalDesk["sports"][number];

export interface EntryValue {
  sportId: string;
  cycleYear: string;
  origin: SchoolValue;
  enteredAt: string;
  classAtEntry: string;
  eligibilityYears: string;
  isGradTransfer: boolean;
  position: string;
  heightIn: string;
  weightLb: string;
  source: SourceValue;
}

export function emptyEntry(
  sportId = "",
  origin: SchoolValue = EMPTY_SCHOOL,
): EntryValue {
  return {
    sportId,
    cycleYear: String(defaultCycleYear()),
    origin,
    enteredAt: localNow(),
    classAtEntry: "",
    eligibilityYears: "",
    isGradTransfer: false,
    position: "",
    heightIn: "",
    weightLb: "",
    source: EMPTY_SOURCE,
  };
}

/** The shape `entrySchema` in `actions/portal.ts` parses. */
export function entryPayload(entry: EntryValue) {
  return {
    sportId: entry.sportId,
    cycleYear: entry.cycleYear,
    origin: {
      schoolId: entry.origin.schoolId,
      schoolName: entry.origin.schoolName,
    },
    enteredAt: localToIso(entry.enteredAt),
    classAtEntry: entry.classAtEntry || null,
    eligibilityYears: entry.eligibilityYears,
    isGradTransfer: entry.isGradTransfer,
    attributes: {
      position: entry.position || null,
      heightIn: entry.heightIn,
      weightLb: entry.weightLb,
    },
    ...sourcePayload(entry.source),
  };
}

/**
 * A player entering the portal. `lockedSport` hides the sport picker when the
 * entry is for a sport the page already chose.
 */
export function EntryFields({
  value,
  onChange,
  sports,
  lockedSport = false,
  lockedOrigin = false,
}: {
  value: EntryValue;
  onChange: (value: EntryValue) => void;
  sports: Sport[];
  lockedSport?: boolean;
  lockedOrigin?: boolean;
}) {
  const gradId = useId();
  const set = (patch: Partial<EntryValue>) => onChange({ ...value, ...patch });
  const sportSlug = sports.find((sport) => sport.id === value.sportId)?.slug;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {lockedSport ? null : (
          <OptionSelect
            label="Sport"
            value={value.sportId}
            allowNone={false}
            placeholder="Pick a sport"
            onChange={(sportId) => set({ sportId, position: "" })}
            options={sports.map((sport) => ({
              value: sport.id,
              label: sport.name,
            }))}
          />
        )}
        <TextField
          label="Cycle"
          inputMode="numeric"
          className="w-24"
          value={value.cycleYear}
          onChange={(cycleYear) => set({ cycleYear })}
        />
        <TextField
          label="Entered"
          type="datetime-local"
          className="w-56"
          value={value.enteredAt}
          onChange={(enteredAt) => set({ enteredAt })}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {lockedOrigin ? (
          <div className="flex flex-col gap-1.5">
            <Label>Leaving</Label>
            <p className="py-2 text-sm">{value.origin.label}</p>
          </div>
        ) : (
          <SchoolPicker
            label="Leaving"
            value={value.origin}
            onChange={(origin) => set({ origin })}
          />
        )}
        <OptionSelect
          label="Class"
          value={value.classAtEntry}
          onChange={(classAtEntry) => set({ classAtEntry })}
          options={PLAYER_CLASSES.map((item) => ({
            value: item.code,
            label: `${item.code} · ${item.label}`,
          }))}
        />
        <TextField
          label="Years left"
          inputMode="numeric"
          className="w-24"
          value={value.eligibilityYears}
          onChange={(eligibilityYears) => set({ eligibilityYears })}
        />
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id={gradId}
            checked={value.isGradTransfer}
            onCheckedChange={(checked) =>
              set({ isGradTransfer: checked === true })
            }
          />
          <Label htmlFor={gradId}>Grad transfer</Label>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <OptionSelect
          label="Position"
          value={value.position}
          onChange={(position) => set({ position })}
          options={positionOptions(sportSlug)}
          className="w-56"
        />
        <TextField
          label="Height (in)"
          inputMode="numeric"
          className="w-24"
          value={value.heightIn}
          onChange={(heightIn) => set({ heightIn })}
        />
        <TextField
          label="Weight (lb)"
          inputMode="numeric"
          className="w-24"
          value={value.weightLb}
          onChange={(weightLb) => set({ weightLb })}
        />
      </div>
      <SourceFields
        value={value.source}
        onChange={(source) => set({ source })}
      />
    </div>
  );
}
