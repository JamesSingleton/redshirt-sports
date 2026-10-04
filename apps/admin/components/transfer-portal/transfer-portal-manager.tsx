"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@redshirt-sports/ui/components/alert-dialog";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@redshirt-sports/ui/components/tabs";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deletePlayerAction,
  deletePortalEntryAction,
} from "@/actions/transfer-portal";
import {
  type AdminPortalEntry,
  EntryFormDialog,
  STATUS_LABELS,
} from "@/components/transfer-portal/entry-form-dialog";
import {
  type AdminPlayer,
  PlayerFormDialog,
} from "@/components/transfer-portal/player-form-dialog";
import type { SchoolOption } from "@/components/transfer-portal/school-combobox";

type EntryRow = AdminPortalEntry & {
  fromSchool: SchoolOption;
  toSchool: SchoolOption | null;
};

type PlayerDialog = { player: AdminPlayer | null; key: number } | null;
type EntryDialog = {
  player: AdminPortalEntry["player"];
  entry: AdminPortalEntry | null;
  key: number;
} | null;
type PendingDelete =
  | { kind: "player"; id: string; label: string }
  | { kind: "entry"; id: string; label: string }
  | null;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function schoolName(school: SchoolOption | null) {
  return school ? (school.shortName ?? school.name ?? "Unknown") : "Undecided";
}

export function TransferPortalManager({
  players,
  entries,
  schools,
  sports,
  search,
}: {
  players: AdminPlayer[];
  entries: EntryRow[];
  schools: SchoolOption[];
  sports: Array<{ id: string; name: string }>;
  search: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [playerDialog, setPlayerDialog] = useState<PlayerDialog>(null);
  const [entryDialog, setEntryDialog] = useState<EntryDialog>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    startTransition(async () => {
      const result =
        target.kind === "player"
          ? await deletePlayerAction(target.id)
          : await deletePortalEntryAction(target.id);
      if (result.ok) {
        toast.success(
          target.kind === "player" ? "Player deleted" : "Portal entry deleted",
        );
        setPendingDelete(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Transfer portal
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage players and their portal entries. The public pages stay hidden
          until ENABLE_TRANSFER_PORTAL is set on the web app.
        </p>
      </div>

      <Tabs defaultValue="players" className="gap-4">
        <TabsList>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="entries">Portal entries</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Form action="/transfer-portal" className="sm:w-72">
              <Input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search players"
                aria-label="Search players"
              />
            </Form>
            <Button
              onClick={() => setPlayerDialog({ player: null, key: Date.now() })}
            >
              <IconPlus />
              New player
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-8 text-center"
                    >
                      {search
                        ? "No players match that search."
                        : "No players yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        {player.firstName} {player.lastName}
                        <span className="text-muted-foreground ml-2 text-xs">
                          {player.slug}
                        </span>
                      </TableCell>
                      <TableCell>{player.sportName}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>
                        {player.academicYear
                          ? `${player.isRedshirt ? "RS " : ""}${player.academicYear}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEntryDialog({
                                player,
                                entry: null,
                                key: Date.now(),
                              })
                            }
                          >
                            <IconPlus />
                            Portal entry
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${player.firstName} ${player.lastName}`}
                            onClick={() =>
                              setPlayerDialog({ player, key: Date.now() })
                            }
                          >
                            <IconPencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${player.firstName} ${player.lastName}`}
                            onClick={() =>
                              setPendingDelete({
                                kind: "player",
                                id: player.id,
                                label: `${player.firstName} ${player.lastName}`,
                              })
                            }
                          >
                            <IconTrash />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="entries">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No portal entries yet. Add one from a player row.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const label = `${entry.player.firstName} ${entry.player.lastName}`;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell>{entry.portalYear}</TableCell>
                        <TableCell>{schoolName(entry.fromSchool)}</TableCell>
                        <TableCell>{schoolName(entry.toSchool)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {STATUS_LABELS[entry.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dateFormat.format(new Date(entry.enteredAt))}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Edit ${label} portal entry`}
                              onClick={() =>
                                setEntryDialog({
                                  player: entry.player,
                                  entry,
                                  key: Date.now(),
                                })
                              }
                            >
                              <IconPencil />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Delete ${label} portal entry`}
                              onClick={() =>
                                setPendingDelete({
                                  kind: "entry",
                                  id: entry.id,
                                  label: `${label}'s ${entry.portalYear} portal entry`,
                                })
                              }
                            >
                              <IconTrash />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {playerDialog ? (
        <PlayerFormDialog
          key={playerDialog.key}
          open
          onOpenChange={(open) => {
            if (!open) setPlayerDialog(null);
          }}
          player={playerDialog.player}
          sports={sports}
        />
      ) : null}

      {entryDialog ? (
        <EntryFormDialog
          key={entryDialog.key}
          open
          onOpenChange={(open) => {
            if (!open) setEntryDialog(null);
          }}
          player={entryDialog.player}
          entry={entryDialog.entry}
          schools={schools}
        />
      ) : null}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "player"
                ? "This also deletes every portal entry for this player. It cannot be undone."
                : "This removes the entry from the public wire. It cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
