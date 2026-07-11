"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { useEffect, useState, useTransition } from "react";

import { listPlayersAction, listSchoolsForSelect } from "@/actions/players";
import {
  createPortalEntryAction,
  deletePortalEntryAction,
  listPortalEntriesAction,
  PORTAL_STATUSES,
  type PortalEntryInput,
  type PortalStatus,
  updatePortalEntryAction,
} from "@/actions/transfer-portal";

type PortalEntry = Awaited<ReturnType<typeof listPortalEntriesAction>>[number];
type PlayerOption = Awaited<ReturnType<typeof listPlayersAction>>[number];
type School = Awaited<ReturnType<typeof listSchoolsForSelect>>[number];

type PortalFormState = {
  playerId: string;
  status: PortalStatus;
  portalYear: number;
  fromSchoolId: string;
  toSchoolId: string;
  eventDate: string;
  enteredAt: string;
  classRank: string;
  syncPlayerOnCommit: boolean;
};

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function schoolLabel(school: School) {
  return school.shortName || school.name || school.abbreviation || school.id;
}

function playerLabel(player: PlayerOption) {
  return (
    player.displayName ||
    `${player.firstName} ${player.lastName}`.trim() ||
    player.slug
  );
}

function emptyForm(year: number): PortalFormState {
  return {
    playerId: "",
    status: "ENTERED",
    portalYear: year,
    fromSchoolId: "",
    toSchoolId: "",
    eventDate: "",
    enteredAt: "",
    classRank: "",
    syncPlayerOnCommit: true,
  };
}

function entryToForm(entry: PortalEntry): PortalFormState {
  return {
    playerId: entry.playerId,
    status: entry.status as PortalStatus,
    portalYear: entry.portalYear,
    fromSchoolId: entry.fromSchoolId,
    toSchoolId: entry.toSchoolId ?? "",
    eventDate: toDateInputValue(entry.eventDate),
    enteredAt: toDateInputValue(entry.enteredAt),
    classRank: entry.classRank ?? "",
    syncPlayerOnCommit: true,
  };
}

function formToInput(form: PortalFormState): PortalEntryInput {
  return {
    playerId: form.playerId,
    status: form.status,
    portalYear: form.portalYear,
    fromSchoolId: form.fromSchoolId,
    toSchoolId: form.toSchoolId || null,
    eventDate: form.eventDate || null,
    enteredAt: form.enteredAt || null,
    classRank: form.classRank || null,
    syncPlayerOnCommit: form.syncPlayerOnCommit,
  };
}

export function TransferPortalPanel() {
  const currentYear = new Date().getFullYear();
  const [portalYear, setPortalYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<PortalStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [form, setForm] = useState<PortalFormState>(() =>
    emptyForm(currentYear),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadEntries(
    nextYear = portalYear,
    nextStatus = statusFilter,
    nextSearch = search,
  ) {
    startTransition(async () => {
      try {
        const result = await listPortalEntriesAction({
          portalYear: nextYear,
          status: nextStatus,
          search: nextSearch || undefined,
        });
        setEntries(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load portal entries",
        );
      }
    });
  }

  function loadPlayers(nextSearch = playerSearch) {
    startTransition(async () => {
      try {
        const result = await listPlayersAction({
          search: nextSearch || undefined,
          limit: 50,
        });
        setPlayers(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load players");
      }
    });
  }

  function loadSchools(nextSearch = schoolSearch) {
    startTransition(async () => {
      try {
        const result = await listSchoolsForSelect({
          search: nextSearch || undefined,
        });
        setSchools(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schools");
      }
    });
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        const [entriesResult, playersResult, schoolsResult] = await Promise.all(
          [
            listPortalEntriesAction({ portalYear: currentYear }),
            listPlayersAction({ limit: 50 }),
            listSchoolsForSelect(),
          ],
        );
        setEntries(entriesResult);
        setPlayers(playersResult);
        setSchools(schoolsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    });
  }, [currentYear]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(portalYear));
    setDialogOpen(true);
    setError(null);
    setMessage(null);
  }

  function openEdit(entry: PortalEntry) {
    setEditingId(entry.id);
    setForm(entryToForm(entry));
    setDialogOpen(true);
    setError(null);
    setMessage(null);

    // Ensure the selected player/schools appear in option lists
    startTransition(async () => {
      try {
        const [playersResult, schoolsResult] = await Promise.all([
          listPlayersAction({
            search:
              entry.playerDisplayName ||
              `${entry.playerFirstName} ${entry.playerLastName}`,
            limit: 50,
          }),
          listSchoolsForSelect(),
        ]);
        setPlayers(playersResult);
        setSchools(schoolsResult);
      } catch {
        // Non-fatal; form still has IDs
      }
    });
  }

  function updateField<K extends keyof PortalFormState>(
    key: K,
    value: PortalFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function saveEntry() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const payload = formToInput(form);
        if (editingId) {
          await updatePortalEntryAction(editingId, payload);
          setMessage("Portal entry updated.");
        } else {
          await createPortalEntryAction(payload);
          setMessage("Portal entry created.");
        }
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm(portalYear));
        const result = await listPortalEntriesAction({
          portalYear,
          status: statusFilter,
          search: search || undefined,
        });
        setEntries(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function removeEntry(entry: PortalEntry) {
    const label =
      entry.playerDisplayName ||
      `${entry.playerFirstName} ${entry.playerLastName}`;
    if (!window.confirm(`Delete portal entry for ${label}?`)) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await deletePortalEntryAction(entry.id);
        setMessage(`Deleted entry for ${label}.`);
        const result = await listPortalEntriesAction({
          portalYear,
          status: statusFilter,
          search: search || undefined,
        });
        setEntries(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transfer Portal</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage transfer portal entries by year and status.
          </p>
        </div>
        <Button onClick={openCreate}>Add entry</Button>
      </div>

      {error ? <p className="text-destructive text-sm px-1">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400 px-1">
          {message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Portal year is required. Status and search are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="portalYear">Portal year</Label>
            <Input
              id="portalYear"
              type="number"
              value={portalYear}
              onChange={(e) => setPortalYear(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="statusFilter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value) setStatusFilter(value as PortalStatus | "all");
              }}
            >
              <SelectTrigger id="statusFilter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {PORTAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="search">Player search</Label>
            <Input
              id="search"
              placeholder="Name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadEntries();
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => loadEntries()}
              disabled={isPending}
            >
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>
            {isPending && entries.length === 0
              ? "Loading…"
              : `${entries.length} entr${entries.length === 1 ? "y" : "ies"} for ${portalYear}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Event date</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No portal entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.playerDisplayName ||
                        `${entry.playerFirstName} ${entry.playerLastName}`}
                    </TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>
                      {entry.fromSchoolShortName || entry.fromSchoolName || "—"}
                    </TableCell>
                    <TableCell>
                      {entry.toSchoolShortName || entry.toSchoolName || "—"}
                    </TableCell>
                    <TableCell>{formatDate(entry.eventDate)}</TableCell>
                    <TableCell>{entry.playerPosition || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(entry)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeEntry(entry)}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit portal entry" : "Add portal entry"}
            </DialogTitle>
            <DialogDescription>
              ENTERED entries default event date to now. COMMITTED with a
              destination school can sync the player record.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="playerSearch">Player search</Label>
              <div className="flex gap-2">
                <Input
                  id="playerSearch"
                  placeholder="Filter players…"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      loadPlayers();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadPlayers()}
                >
                  Filter
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="playerId">Player</Label>
              <select
                id="playerId"
                className="border-input bg-transparent h-8 w-full rounded-lg border px-2.5 text-sm"
                value={form.playerId}
                onChange={(e) => updateField("playerId", e.target.value)}
                required
              >
                <option value="">Select player…</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {playerLabel(player)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value) updateField("status", value as PortalStatus);
                }}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTAL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="formPortalYear">Portal year</Label>
              <Input
                id="formPortalYear"
                type="number"
                value={form.portalYear}
                onChange={(e) =>
                  updateField("portalYear", Number(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="schoolSearch">School search</Label>
              <div className="flex gap-2">
                <Input
                  id="schoolSearch"
                  placeholder="Filter schools…"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      loadSchools();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadSchools()}
                >
                  Filter
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fromSchoolId">From school</Label>
              <select
                id="fromSchoolId"
                className="border-input bg-transparent h-8 w-full rounded-lg border px-2.5 text-sm"
                value={form.fromSchoolId}
                onChange={(e) => updateField("fromSchoolId", e.target.value)}
                required
              >
                <option value="">Select school…</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {schoolLabel(school)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="toSchoolId">To school</Label>
              <select
                id="toSchoolId"
                className="border-input bg-transparent h-8 w-full rounded-lg border px-2.5 text-sm"
                value={form.toSchoolId}
                onChange={(e) => updateField("toSchoolId", e.target.value)}
              >
                <option value="">None</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {schoolLabel(school)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="enteredAt">Entered at</Label>
              <Input
                id="enteredAt"
                type="date"
                value={form.enteredAt}
                onChange={(e) => updateField("enteredAt", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="classRank">Class rank</Label>
              <Input
                id="classRank"
                value={form.classRank}
                onChange={(e) => updateField("classRank", e.target.value)}
              />
            </div>
            {form.status === "COMMITTED" ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.syncPlayerOnCommit}
                  onChange={(e) =>
                    updateField("syncPlayerOnCommit", e.target.checked)
                  }
                />
                Sync player committed school / status
              </label>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEntry} disabled={isPending}>
              {editingId ? "Save changes" : "Create entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
