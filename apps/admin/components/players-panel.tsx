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
import { Textarea } from "@redshirt-sports/ui/components/textarea";
import { useEffect, useState, useTransition } from "react";

import {
  createPlayerAction,
  deletePlayerAction,
  listPlayersAction,
  listSchoolsForSelect,
  listSportsForSelect,
  type PlayerInput,
  updatePlayerAction,
} from "@/actions/players";

type Player = Awaited<ReturnType<typeof listPlayersAction>>[number];
type Sport = Awaited<ReturnType<typeof listSportsForSelect>>[number];
type School = Awaited<ReturnType<typeof listSchoolsForSelect>>[number];

const EMPTY_FORM: PlayerInput = {
  firstName: "",
  lastName: "",
  displayName: "",
  slug: "",
  sportId: "",
  position: "",
  classYear: null,
  heightInches: null,
  weightLbs: null,
  headshotUrl: "",
  hometown: "",
  highSchool: "",
  bio: "",
  currentStatus: "",
  lastSchoolId: "",
  committedSchoolId: "",
};

function playerToForm(player: Player): PlayerInput {
  return {
    firstName: player.firstName,
    lastName: player.lastName,
    displayName: player.displayName ?? "",
    slug: player.slug,
    sportId: player.sportId ?? "",
    position: player.position ?? "",
    classYear: player.classYear,
    heightInches: player.heightInches,
    weightLbs: player.weightLbs,
    headshotUrl: player.headshotUrl ?? "",
    hometown: player.hometown ?? "",
    highSchool: player.highSchool ?? "",
    bio: player.bio ?? "",
    currentStatus: player.currentStatus ?? "",
    lastSchoolId: player.lastSchoolId ?? "",
    committedSchoolId: player.committedSchoolId ?? "",
  };
}

function schoolLabel(school: School) {
  return school.shortName || school.name || school.abbreviation || school.id;
}

function parseOptionalInt(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function PlayersPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [form, setForm] = useState<PlayerInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadPlayers(nextSearch = search) {
    startTransition(async () => {
      try {
        const result = await listPlayersAction({
          search: nextSearch || undefined,
          limit: 100,
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
        const [playersResult, sportsResult, schoolsResult] = await Promise.all([
          listPlayersAction({ limit: 100 }),
          listSportsForSelect(),
          listSchoolsForSelect(),
        ]);
        setPlayers(playersResult);
        setSports(sportsResult);
        setSchools(schoolsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    });
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
    setError(null);
    setMessage(null);
  }

  function openEdit(player: Player) {
    setEditingId(player.id);
    setForm(playerToForm(player));
    setDialogOpen(true);
    setError(null);
    setMessage(null);
  }

  function updateField<K extends keyof PlayerInput>(
    key: K,
    value: PlayerInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function savePlayer() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePlayerAction(editingId, form);
          setMessage("Player updated.");
        } else {
          await createPlayerAction(form);
          setMessage("Player created.");
        }
        setDialogOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        const result = await listPlayersAction({
          search: search || undefined,
          limit: 100,
        });
        setPlayers(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function removePlayer(player: Player) {
    const label =
      player.displayName || `${player.firstName} ${player.lastName}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await deletePlayerAction(player.id);
        setMessage(`Deleted ${label}.`);
        const result = await listPlayersAction({
          search: search || undefined,
          limit: 100,
        });
        setPlayers(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Players</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, edit, and delete player records.
          </p>
        </div>
        <Button onClick={openCreate}>Add player</Button>
      </div>

      {error ? <p className="text-destructive text-sm px-1">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400 px-1">
          {message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Filter by name or slug. Results limited to 100.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadPlayers();
            }}
          />
          <Button
            variant="outline"
            onClick={() => loadPlayers()}
            disabled={isPending}
          >
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            {isPending && players.length === 0
              ? "Loading…"
              : `${players.length} player${players.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No players found.
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      {player.displayName ||
                        `${player.firstName} ${player.lastName}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {player.slug}
                    </TableCell>
                    <TableCell>
                      {player.sportName || player.sportSlug || "—"}
                    </TableCell>
                    <TableCell>{player.position || "—"}</TableCell>
                    <TableCell>{player.currentStatus || "—"}</TableCell>
                    <TableCell>{player.lastSchoolName || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(player)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePlayer(player)}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit player" : "Add player"}
            </DialogTitle>
            <DialogDescription>
              Slug is generated from first and last name when left blank.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName ?? ""}
                onChange={(e) => updateField("displayName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug ?? ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="auto from name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sportId">Sport</Label>
              <Select
                value={form.sportId || "__none__"}
                onValueChange={(value) =>
                  updateField(
                    "sportId",
                    !value || value === "__none__" ? "" : value,
                  )
                }
              >
                <SelectTrigger id="sportId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.displayName || sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={form.position ?? ""}
                onChange={(e) => updateField("position", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="classYear">Class year</Label>
              <Input
                id="classYear"
                type="number"
                value={form.classYear ?? ""}
                onChange={(e) =>
                  updateField("classYear", parseOptionalInt(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentStatus">Current status</Label>
              <Input
                id="currentStatus"
                value={form.currentStatus ?? ""}
                onChange={(e) => updateField("currentStatus", e.target.value)}
                placeholder="e.g. COMMITTED, ENTERED"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="heightInches">Height (inches)</Label>
              <Input
                id="heightInches"
                type="number"
                value={form.heightInches ?? ""}
                onChange={(e) =>
                  updateField("heightInches", parseOptionalInt(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weightLbs">Weight (lbs)</Label>
              <Input
                id="weightLbs"
                type="number"
                value={form.weightLbs ?? ""}
                onChange={(e) =>
                  updateField("weightLbs", parseOptionalInt(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="headshotUrl">Headshot URL</Label>
              <Input
                id="headshotUrl"
                value={form.headshotUrl ?? ""}
                onChange={(e) => updateField("headshotUrl", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hometown">Hometown</Label>
              <Input
                id="hometown"
                value={form.hometown ?? ""}
                onChange={(e) => updateField("hometown", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="highSchool">High school</Label>
              <Input
                id="highSchool"
                value={form.highSchool ?? ""}
                onChange={(e) => updateField("highSchool", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="schoolSearch">School search</Label>
              <div className="flex gap-2">
                <Input
                  id="schoolSearch"
                  placeholder="Filter schools for selects…"
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
              <Label htmlFor="lastSchoolId">Last school</Label>
              <select
                id="lastSchoolId"
                className="border-input bg-transparent h-8 w-full rounded-lg border px-2.5 text-sm"
                value={form.lastSchoolId ?? ""}
                onChange={(e) => updateField("lastSchoolId", e.target.value)}
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
              <Label htmlFor="committedSchoolId">Committed school</Label>
              <select
                id="committedSchoolId"
                className="border-input bg-transparent h-8 w-full rounded-lg border px-2.5 text-sm"
                value={form.committedSchoolId ?? ""}
                onChange={(e) =>
                  updateField("committedSchoolId", e.target.value)
                }
              >
                <option value="">None</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {schoolLabel(school)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePlayer} disabled={isPending}>
              {editingId ? "Save changes" : "Create player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
