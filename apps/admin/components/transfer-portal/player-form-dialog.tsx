"use client";

import {
  ACADEMIC_YEARS,
  type AcademicYear,
} from "@redshirt-sports/db/transfer-portal-constants";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@redshirt-sports/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@redshirt-sports/ui/components/field";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { Switch } from "@redshirt-sports/ui/components/switch";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { savePlayerAction } from "@/actions/transfer-portal";

export type AdminPlayer = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  position: string;
  heightInches: number | null;
  weightLbs: number | null;
  academicYear: AcademicYear | null;
  isRedshirt: boolean;
  hometown: string | null;
  sportId: string;
  sportName: string;
};

type SportOption = { id: string; name: string };

const NO_CLASS = "none";

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
  sports,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: AdminPlayer | null;
  sports: SportOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sportId, setSportId] = useState(
    player?.sportId ?? sports[0]?.id ?? "",
  );
  const [academicYear, setAcademicYear] = useState<string>(
    player?.academicYear ?? NO_CLASS,
  );
  const [isRedshirt, setIsRedshirt] = useState(player?.isRedshirt ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await savePlayerAction(player?.id ?? null, {
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        slug: String(form.get("slug") ?? ""),
        position: String(form.get("position") ?? ""),
        sportId,
        academicYear:
          academicYear === NO_CLASS ? null : (academicYear as AcademicYear),
        isRedshirt,
        heightInches: optionalNumber(form.get("heightInches")),
        weightLbs: optionalNumber(form.get("weightLbs")),
        hometown: String(form.get("hometown") ?? ""),
      });
      if (result.ok) {
        toast.success(player ? "Player updated" : "Player created");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{player ? "Edit player" : "New player"}</DialogTitle>
            <DialogDescription>
              Players show on the public portal wire once they have a portal
              entry.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="player-first-name">First name</FieldLabel>
                <Input
                  id="player-first-name"
                  name="firstName"
                  defaultValue={player?.firstName}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="player-last-name">Last name</FieldLabel>
                <Input
                  id="player-last-name"
                  name="lastName"
                  defaultValue={player?.lastName}
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="player-slug">Slug</FieldLabel>
              <Input
                id="player-slug"
                name="slug"
                defaultValue={player?.slug}
                placeholder="Generated from the name"
              />
              <FieldDescription>
                Used in the URL at /players/slug. Leave blank to generate it.
              </FieldDescription>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="player-sport">Sport</FieldLabel>
                <Select
                  value={sportId}
                  onValueChange={(value) => {
                    if (value !== null) setSportId(value);
                  }}
                  items={sports.map((sport) => ({
                    value: sport.id,
                    label: sport.name,
                  }))}
                >
                  <SelectTrigger id="player-sport" className="w-full">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="player-position">Position</FieldLabel>
                <Input
                  id="player-position"
                  name="position"
                  defaultValue={player?.position}
                  placeholder="QB"
                  maxLength={10}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="player-class">Class</FieldLabel>
                <Select
                  value={academicYear}
                  onValueChange={(value) => {
                    if (value !== null) setAcademicYear(value);
                  }}
                  items={{ [NO_CLASS]: "Unknown" }}
                >
                  <SelectTrigger id="player-class" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CLASS}>Unknown</SelectItem>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal" className="self-end pb-2">
                <Switch
                  id="player-redshirt"
                  checked={isRedshirt}
                  onCheckedChange={setIsRedshirt}
                />
                <FieldLabel htmlFor="player-redshirt">Redshirt</FieldLabel>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="player-height">Height (inches)</FieldLabel>
                <Input
                  id="player-height"
                  name="heightInches"
                  type="number"
                  min={1}
                  max={108}
                  defaultValue={player?.heightInches ?? undefined}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="player-weight">Weight (lbs)</FieldLabel>
                <Input
                  id="player-weight"
                  name="weightLbs"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={player?.weightLbs ?? undefined}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="player-hometown">Hometown</FieldLabel>
              <Input
                id="player-hometown"
                name="hometown"
                defaultValue={player?.hometown ?? undefined}
                placeholder="Bozeman, MT"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !sportId}>
              {player ? "Save player" : "Create player"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
