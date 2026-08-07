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
import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@redshirt-sports/ui/components/command";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import { ScrollArea } from "@redshirt-sports/ui/components/scroll-area";
import { Separator } from "@redshirt-sports/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { Switch } from "@redshirt-sports/ui/components/switch";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { PlusIcon, UserMinusIcon, UsersIcon, XIcon } from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { setPollAssignment, setVoterCredential } from "@/actions/poll-voters";

export type VotingPanelPoll = {
  id: string;
  name: string;
  slug: string;
  sportSlug: string;
};

export type VotingPanelUser = {
  id: string;
  firstName: string;
  lastName: string;
  organization: string | null;
  isVoter: boolean;
};

type OptimisticState = {
  users: VotingPanelUser[];
  assignmentsByPollId: Record<string, string[]>;
};

type OptimisticAction =
  | { type: "credential"; userId: string; isVoter: boolean }
  | { type: "assignment"; pollId: string; userId: string; assigned: boolean };

function reduceOptimistic(
  state: OptimisticState,
  action: OptimisticAction,
): OptimisticState {
  if (action.type === "credential") {
    const assignmentsByPollId = { ...state.assignmentsByPollId };
    if (!action.isVoter) {
      for (const pollId of Object.keys(assignmentsByPollId)) {
        assignmentsByPollId[pollId] = (
          assignmentsByPollId[pollId] ?? []
        ).filter((id) => id !== action.userId);
      }
    }
    return {
      users: state.users.map((user) =>
        user.id === action.userId ? { ...user, isVoter: action.isVoter } : user,
      ),
      assignmentsByPollId,
    };
  }

  const current = new Set(state.assignmentsByPollId[action.pollId] ?? []);
  if (action.assigned) current.add(action.userId);
  else current.delete(action.userId);

  return {
    ...state,
    assignmentsByPollId: {
      ...state.assignmentsByPollId,
      [action.pollId]: [...current],
    },
  };
}

function displayName(user: VotingPanelUser) {
  return `${user.firstName} ${user.lastName}`.trim() || "Unnamed user";
}

function initials(user: VotingPanelUser) {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function pollLabel(poll: VotingPanelPoll) {
  return poll.name || poll.slug.toUpperCase();
}

function pollMeta(poll: VotingPanelPoll) {
  const parts = [poll.sportSlug, poll.slug].filter(Boolean);
  return parts.join(" · ").toUpperCase();
}

export function VotingPanels({
  polls,
  users,
  assignmentsByPollId,
}: {
  polls: VotingPanelPoll[];
  users: VotingPanelUser[];
  assignmentsByPollId: Record<string, string[]>;
}) {
  const [selectedPollId, setSelectedPollId] = useState(polls[0]?.id ?? "");
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [credentialQuery, setCredentialQuery] = useState("");
  const [pending, startPending] = useTransition();
  const [confirmUser, setConfirmUser] = useState<VotingPanelUser | null>(null);

  const [optimistic, applyOptimistic] = useOptimistic(
    { users, assignmentsByPollId },
    reduceOptimistic,
  );

  const selectedPoll =
    polls.find((poll) => poll.id === selectedPollId) ?? polls[0] ?? null;

  const usersById = useMemo(() => {
    return new Map(optimistic.users.map((user) => [user.id, user]));
  }, [optimistic.users]);

  const panelCounts = useMemo(() => {
    return Object.fromEntries(
      polls.map((poll) => [
        poll.id,
        (optimistic.assignmentsByPollId[poll.id] ?? []).length,
      ]),
    ) as Record<string, number>;
  }, [polls, optimistic.assignmentsByPollId]);

  const roster = useMemo(() => {
    if (!selectedPoll) return [];
    const ids = optimistic.assignmentsByPollId[selectedPoll.id] ?? [];
    return ids
      .map((id) => usersById.get(id))
      .filter((user): user is VotingPanelUser => Boolean(user))
      .sort((a, b) =>
        displayName(a).localeCompare(displayName(b), undefined, {
          sensitivity: "base",
        }),
      );
  }, [selectedPoll, optimistic.assignmentsByPollId, usersById]);

  const addableVoters = useMemo(() => {
    if (!selectedPoll) return [];
    const assigned = new Set(
      optimistic.assignmentsByPollId[selectedPoll.id] ?? [],
    );
    return optimistic.users
      .filter((user) => user.isVoter && !assigned.has(user.id))
      .sort((a, b) =>
        displayName(a).localeCompare(displayName(b), undefined, {
          sensitivity: "base",
        }),
      );
  }, [selectedPoll, optimistic.users, optimistic.assignmentsByPollId]);

  const credentialedCount = optimistic.users.filter((u) => u.isVoter).length;

  const filteredCredentialUsers = useMemo(() => {
    const q = credentialQuery.trim().toLowerCase();
    return optimistic.users
      .filter((user) => {
        if (!q) return true;
        const haystack =
          `${displayName(user)} ${user.organization ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (a.isVoter !== b.isVoter) return a.isVoter ? -1 : 1;
        return displayName(a).localeCompare(displayName(b), undefined, {
          sensitivity: "base",
        });
      });
  }, [optimistic.users, credentialQuery]);

  function runCredential(userId: string, isVoter: boolean) {
    startPending(async () => {
      applyOptimistic({ type: "credential", userId, isVoter });
      try {
        await setVoterCredential({ userId, isVoter });
        toast.success(
          isVoter ? "Voter access granted" : "Voter access removed",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update voter access",
        );
      }
    });
  }

  function runAssignment(pollId: string, userId: string, assigned: boolean) {
    startPending(async () => {
      applyOptimistic({ type: "assignment", pollId, userId, assigned });
      try {
        await setPollAssignment({ pollId, userId, assigned });
        toast.success(assigned ? "Added to panel" : "Removed from panel");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update panel",
        );
      }
    });
  }

  if (polls.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        No Top 25 polls exist yet. Create a poll before assigning voters.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
            Top 25
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Voting panels
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Pick a poll, then build its ballot panel. Credentials decide who can
            sit on any panel at all.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending ? <Badge variant="secondary">Saving…</Badge> : null}
          <Button variant="outline" onClick={() => setCredentialsOpen(true)}>
            <UsersIcon data-icon="inline-start" />
            Credentials
            <Badge variant="secondary">{credentialedCount}</Badge>
          </Button>
        </div>
      </div>

      <div className="grid min-h-[32rem] overflow-hidden rounded-xl border lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Poll panels"
          className="bg-muted/30 flex flex-col border-b lg:border-r lg:border-b-0"
        >
          <div className="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide uppercase">
            Panels
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-2">
              {polls.map((poll) => {
                const selected = poll.id === selectedPoll?.id;
                const count = panelCounts[poll.id] ?? 0;
                return (
                  <button
                    key={poll.id}
                    type="button"
                    onClick={() => setSelectedPollId(poll.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      "hover:bg-accent/60 focus-visible:ring-ring outline-none focus-visible:ring-2",
                      selected && "bg-background shadow-sm ring-1 ring-border",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-2xl font-semibold tabular-nums tracking-tight",
                        selected ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {pollLabel(poll)}
                      </span>
                      <span className="text-muted-foreground truncate text-[11px] tracking-wide">
                        {pollMeta(poll)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </nav>

        <section className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {selectedPoll ? pollLabel(selectedPoll) : "Panel"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {roster.length} {roster.length === 1 ? "voter" : "voters"} on
                this panel
              </p>
            </div>

            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger asChild>
                <Button disabled={pending || !selectedPoll}>
                  <PlusIcon data-icon="inline-start" />
                  Add to panel
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search credentialed voters…" />
                  <CommandList>
                    <CommandEmpty>
                      {addableVoters.length === 0
                        ? "Everyone with credentials is already on this panel, or nobody has credentials yet."
                        : "No matching voters."}
                    </CommandEmpty>
                    <CommandGroup heading="Credentialed voters">
                      {addableVoters.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${displayName(user)} ${user.organization ?? ""}`}
                          onSelect={() => {
                            if (!selectedPoll) return;
                            setAddOpen(false);
                            runAssignment(selectedPoll.id, user.id, true);
                          }}
                        >
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">
                              {displayName(user)}
                            </span>
                            {user.organization ? (
                              <span className="text-muted-foreground truncate text-xs">
                                {user.organization}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {credentialedCount === 0 ? (
                  <div className="border-t p-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setAddOpen(false);
                        setCredentialsOpen(true);
                      }}
                    >
                      Grant credentials first
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>

          <ScrollArea className="flex-1">
            {roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                  <UsersIcon className="text-muted-foreground size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">This panel is empty</p>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Add credentialed voters who should submit ballots for{" "}
                    {selectedPoll ? pollLabel(selectedPoll) : "this poll"}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setAddOpen(true)}
                  disabled={!selectedPoll}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add to panel
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {roster.map((user) => (
                  <li
                    key={user.id}
                    className="hover:bg-muted/40 flex items-center gap-3 px-5 py-3 transition-colors"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="text-xs">
                        {initials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {displayName(user)}
                      </span>
                      {user.organization ? (
                        <span className="text-muted-foreground truncate text-sm">
                          {user.organization}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No organization
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending || !selectedPoll}
                      aria-label={`Remove ${displayName(user)} from panel`}
                      onClick={() => {
                        if (!selectedPoll) return;
                        runAssignment(selectedPoll.id, user.id, false);
                      }}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </section>
      </div>

      <Sheet open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <SheetHeader className="shrink-0 border-b">
            <SheetTitle>Voter credentials</SheetTitle>
            <SheetDescription>
              Turning access off removes someone from every panel. Past ballots
              stay on record.
            </SheetDescription>
          </SheetHeader>

          <div className="flex shrink-0 flex-col gap-3 px-4 py-3">
            <Input
              value={credentialQuery}
              onChange={(event) => setCredentialQuery(event.target.value)}
              placeholder="Search people…"
              aria-label="Search people"
            />
            <p className="text-muted-foreground text-xs">
              {credentialedCount} with access · {optimistic.users.length} total
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
            <ul className="flex flex-col gap-1">
              {filteredCredentialUsers.map((user) => (
                <li
                  key={user.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="text-[10px]">
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {displayName(user)}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.organization ?? "No organization"}
                    </span>
                  </div>
                  <Switch
                    checked={user.isVoter}
                    disabled={pending}
                    aria-label={`Voter access for ${displayName(user)}`}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setConfirmUser(user);
                        return;
                      }
                      runCredential(user.id, true);
                    }}
                  />
                </li>
              ))}
              {filteredCredentialUsers.length === 0 ? (
                <li className="text-muted-foreground px-2 py-8 text-center text-sm">
                  No people match that search.
                </li>
              ) : null}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmUser != null}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove voter access?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser
                ? `${displayName(confirmUser)} will lose access and leave every voting panel. Historical ballots are kept.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirmUser) return;
                runCredential(confirmUser.id, false);
                setConfirmUser(null);
              }}
            >
              <UserMinusIcon data-icon="inline-start" />
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
