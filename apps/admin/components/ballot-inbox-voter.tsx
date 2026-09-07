"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@redshirt-sports/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@redshirt-sports/ui/components/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { IconCopy, IconMail } from "@tabler/icons-react";
import { useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";

type WeekOption = {
  weekKey: string;
  label: string;
};

type InboxVoter = {
  userId: string;
  firstName: string;
  lastName: string;
  organization: string | null;
  submitted: boolean;
};

export function BallotInboxVoter({
  voter,
  otherWeeks,
  reassignTarget,
  onReassignTargetChange,
  onReassign,
  onCopyNudge,
  onEmailNudge,
  pending,
}: {
  voter: InboxVoter;
  otherWeeks: WeekOption[];
  reassignTarget: string;
  onReassignTargetChange: (weekKey: string) => void;
  onReassign: () => void;
  onCopyNudge: () => void;
  onEmailNudge: () => void;
  pending: boolean;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const name = `${voter.firstName} ${voter.lastName}`;
  const organization = voter.organization ?? "No organization";

  const actions = voter.submitted ? (
    otherWeeks.length > 0 ? (
      <div className="flex flex-col gap-3">
        <Select value={reassignTarget} onValueChange={onReassignTargetChange}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue placeholder="Move to…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {otherWeeks.map((week) => (
                <SelectItem key={week.weekKey} value={week.weekKey}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={onReassign}
          disabled={pending || !reassignTarget}
        >
          Move ballot
        </Button>
      </div>
    ) : (
      <p className="text-muted-foreground text-sm">
        No other weeks available to move this ballot.
      </p>
    )
  ) : (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onCopyNudge}
        disabled={pending}
      >
        <IconCopy data-icon="inline-start" />
        Copy nudge
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onEmailNudge}
        disabled={pending}
      >
        <IconMail data-icon="inline-start" />
        Email
      </Button>
    </div>
  );

  const trigger = (
    <Button size="sm" variant="outline">
      Manage
    </Button>
  );

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-sm">
          {organization}
        </span>
      </div>
      <Badge variant={voter.submitted ? "outline" : "secondary"}>
        {voter.submitted ? "Submitted" : "Missing"}
      </Badge>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{name}</DrawerTitle>
              <DrawerDescription>{organization}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">{actions}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>{organization}</DialogDescription>
            </DialogHeader>
            {actions}
          </DialogContent>
        </Dialog>
      )}
    </li>
  );
}
