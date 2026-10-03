"use client";

import type { PortalStatus } from "@redshirt-sports/db/transfer-portal-constants";
import { PORTAL_STATUSES } from "@redshirt-sports/db/transfer-portal-constants";
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
  FieldLegend,
  FieldSet,
} from "@redshirt-sports/ui/components/field";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { savePortalEntryAction } from "@/actions/transfer-portal";
import {
  SchoolCombobox,
  type SchoolOption,
} from "@/components/transfer-portal/school-combobox";

export const STATUS_LABELS: Record<PortalStatus, string> = {
  ENTERED: "In portal",
  COMMITTED: "Committed",
  SIGNED: "Signed",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
};

export type AdminPortalEntry = {
  id: string;
  portalYear: number;
  status: PortalStatus;
  enteredAt: Date;
  committedAt: Date | null;
  signedAt: Date | null;
  enrolledAt: Date | null;
  withdrawnAt: Date | null;
  player: { id: string; firstName: string; lastName: string };
  fromSchool: { id: string };
  toSchool: { id: string } | null;
};

const DATE_FIELDS = [
  { name: "committedAt", label: "Committed" },
  { name: "signedAt", label: "Signed" },
  { name: "enrolledAt", label: "Enrolled" },
  { name: "withdrawnAt", label: "Withdrawn" },
] as const;

function toDateInput(date: Date | string | null | undefined) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function EntryFormDialog({
  open,
  onOpenChange,
  player,
  entry,
  schools,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: { id: string; firstName: string; lastName: string };
  entry: AdminPortalEntry | null;
  schools: SchoolOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PortalStatus>(
    entry?.status ?? "ENTERED",
  );
  const [fromSchoolId, setFromSchoolId] = useState<string | null>(
    entry?.fromSchool.id ?? null,
  );
  const [toSchoolId, setToSchoolId] = useState<string | null>(
    entry?.toSchool?.id ?? null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fromSchoolId) {
      toast.error("Choose the school the player is leaving");
      return;
    }
    const form = new FormData(event.currentTarget);
    const date = (name: string) => String(form.get(name) ?? "");
    startTransition(async () => {
      const result = await savePortalEntryAction(entry?.id ?? null, {
        playerId: player.id,
        portalYear: Number.parseInt(date("portalYear"), 10),
        status,
        fromSchoolId,
        toSchoolId,
        enteredAt: date("enteredAt"),
        committedAt: date("committedAt"),
        signedAt: date("signedAt"),
        enrolledAt: date("enrolledAt"),
        withdrawnAt: date("withdrawnAt"),
      });
      if (result.ok) {
        toast.success(entry ? "Portal entry updated" : "Portal entry created");
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
            <DialogTitle>
              {entry ? "Edit portal entry" : "New portal entry"}
            </DialogTitle>
            <DialogDescription>
              {player.firstName} {player.lastName}. The latest date you fill in
              sets the entry's position on the wire.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="entry-year">Portal year</FieldLabel>
                <Input
                  id="entry-year"
                  name="portalYear"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={entry?.portalYear ?? new Date().getFullYear()}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-status">Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    if (value !== null) setStatus(value as PortalStatus);
                  }}
                  items={STATUS_LABELS}
                >
                  <SelectTrigger id="entry-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTAL_STATUSES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {STATUS_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="entry-from">Leaving</FieldLabel>
              <SchoolCombobox
                id="entry-from"
                schools={schools}
                value={fromSchoolId}
                onChange={setFromSchoolId}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-to">Destination</FieldLabel>
              <SchoolCombobox
                id="entry-to"
                schools={schools}
                value={toSchoolId}
                onChange={setToSchoolId}
                placeholder="Undecided"
                clearLabel="Undecided"
              />
              <FieldDescription>
                Set this once the player commits to a new school.
              </FieldDescription>
            </Field>

            <FieldSet>
              <FieldLegend variant="label">Dates</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="entry-enteredAt">Entered</FieldLabel>
                  <Input
                    id="entry-enteredAt"
                    name="enteredAt"
                    type="date"
                    defaultValue={toDateInput(entry?.enteredAt ?? new Date())}
                    required
                  />
                </Field>
                {DATE_FIELDS.map((field) => (
                  <Field key={field.name}>
                    <FieldLabel htmlFor={`entry-${field.name}`}>
                      {field.label}
                    </FieldLabel>
                    <Input
                      id={`entry-${field.name}`}
                      name={field.name}
                      type="date"
                      defaultValue={toDateInput(entry?.[field.name])}
                    />
                  </Field>
                ))}
              </div>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {entry ? "Save entry" : "Create entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
