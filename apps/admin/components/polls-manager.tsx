"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@redshirt-sports/ui/components/dialog";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { Switch } from "@redshirt-sports/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createPollAction, updatePollAction } from "@/actions/polls";

type SportOption = {
  id: string;
  slug: string;
  name: string;
  displayName: string | null;
  isActive: boolean | null;
};

type PollRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sportId: string;
  sportSlug: string;
  sportName: string;
  divisionSportId: string | null;
};

export function PollsManager({
  polls: initialPolls,
  sports,
}: {
  polls: PollRow[];
  sports: SportOption[];
}) {
  const router = useRouter();
  const [pending, startPending] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function refresh() {
    router.refresh();
  }

  function createPoll() {
    startPending(async () => {
      try {
        await createPollAction({ sportId, name, slug, isActive: true });
        toast.success("Poll created");
        setCreateOpen(false);
        setName("");
        setSlug("");
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create poll",
        );
      }
    });
  }

  function toggleActive(poll: PollRow, isActive: boolean) {
    startPending(async () => {
      try {
        await updatePollAction({ id: poll.id, isActive });
        toast.success(isActive ? "Poll activated" : "Poll deactivated");
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update poll",
        );
      }
    });
  }

  function savePoll(poll: PollRow, nextName: string, nextSlug: string) {
    startPending(async () => {
      try {
        await updatePollAction({
          id: poll.id,
          name: nextName,
          slug: nextSlug,
        });
        toast.success("Poll updated");
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update poll",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} disabled={!sports.length}>
          <IconPlus data-icon="inline-start" />
          New poll
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPolls.map((poll) => (
              <PollEditorRow
                key={poll.id}
                poll={poll}
                pending={pending}
                onToggle={toggleActive}
                onSave={savePoll}
              />
            ))}
            {initialPolls.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center"
                >
                  No polls yet. Create FBS, FCS, D2, D3 (and basketball scopes)
                  here.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New poll</DialogTitle>
            <DialogDescription>
              Slug becomes the vote URL segment, e.g.{" "}
              <code className="text-xs">d2</code> →{" "}
              <code className="text-xs">/vote/college/football/d2</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poll-sport">Sport</Label>
              <Select value={sportId} onValueChange={setSportId}>
                <SelectTrigger id="poll-sport" className="w-full">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.displayName || sport.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poll-name">Name</Label>
              <Input
                id="poll-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Division II Top 25"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poll-slug">Slug</Label>
              <Input
                id="poll-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="d2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createPoll}
              disabled={pending || !sportId || !name.trim() || !slug.trim()}
            >
              Create poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PollEditorRow({
  poll,
  pending,
  onToggle,
  onSave,
}: {
  poll: PollRow;
  pending: boolean;
  onToggle: (poll: PollRow, isActive: boolean) => void;
  onSave: (poll: PollRow, name: string, slug: string) => void;
}) {
  const [name, setName] = useState(poll.name);
  const [slug, setSlug] = useState(poll.slug);
  const dirty = name !== poll.name || slug !== poll.slug;

  return (
    <TableRow className={poll.isActive ? undefined : "opacity-60"}>
      <TableCell>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Name for ${poll.slug}`}
        />
      </TableCell>
      <TableCell>
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          aria-label={`Slug for ${poll.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{poll.sportName || "—"}</span>
          <span className="text-muted-foreground text-xs">
            {poll.sportSlug}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={poll.isActive}
          disabled={pending}
          aria-label={`Active ${poll.name}`}
          onCheckedChange={(checked) => onToggle(poll, checked)}
        />
      </TableCell>
      <TableCell>
        {dirty ? (
          <Button
            size="sm"
            disabled={pending || !name.trim() || !slug.trim()}
            onClick={() => onSave(poll, name, slug)}
          >
            Save
          </Button>
        ) : (
          <Badge variant="outline">Saved</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
