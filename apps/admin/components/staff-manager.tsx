"use client";

import {
  STAFF_ROLE_INFO,
  STAFF_ROLES,
  type StaffRole,
} from "@redshirt-sports/auth/roles";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
import { Input } from "@redshirt-sports/ui/components/input";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { findPeople, type StaffMember, setStaffRoles } from "@/actions/staff";

/**
 * Who can do what in the admin. Ticking a box saves at once. Changes reach
 * the person's session within about a minute (when Clerk refreshes it).
 */
export function StaffManager({
  me,
  staff: initial,
}: {
  me: string;
  staff: StaffMember[];
}) {
  const [staff, setStaff] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StaffMember[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => setStaff(initial), [initial]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      findPeople(query).then(
        (people) => !cancelled && setResults(people),
        () => !cancelled && setResults([]),
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function toggle(person: StaffMember, role: StaffRole, on: boolean) {
    const roles = on
      ? [...person.roles, role]
      : person.roles.filter((r) => r !== role);
    startTransition(async () => {
      try {
        const saved = await setStaffRoles({ userId: person.id, roles });
        setStaff((current) =>
          current.map((row) =>
            row.id === person.id ? { ...row, roles: saved } : row,
          ),
        );
        toast.success(`Saved ${person.name}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save");
      }
    });
  }

  function add(person: StaffMember) {
    setStaff((current) =>
      current.some((row) => row.id === person.id)
        ? current
        : [...current, person],
    );
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid gap-3 md:grid-cols-3">
        {STAFF_ROLES.map((role) => (
          <div key={role} className="rounded-xl border p-4">
            <dt className="font-medium">{STAFF_ROLE_INFO[role].label}</dt>
            <dd className="text-muted-foreground mt-1 text-sm">
              {STAFF_ROLE_INFO[role].description}
            </dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <caption className="sr-only">Staff and their roles</caption>
          <thead>
            <tr className="text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
              <th className="p-3 font-medium">Person</th>
              {STAFF_ROLES.map((role) => (
                <th key={role} className="p-3 text-center font-medium">
                  {STAFF_ROLE_INFO[role].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr key={person.id} className="border-b last:border-0">
                <th scope="row" className="p-3 text-left font-normal">
                  <span className="font-medium">{person.name}</span>
                  {person.id === me ? (
                    <span className="text-muted-foreground"> (you)</span>
                  ) : null}
                  <span className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                    {person.organization}
                    {person.isVoter ? (
                      <Badge variant="outline">Voter</Badge>
                    ) : null}
                  </span>
                </th>
                {STAFF_ROLES.map((role) => (
                  <td key={role} className="p-3 text-center">
                    <Checkbox
                      checked={person.roles.includes(role)}
                      disabled={
                        pending || (person.id === me && role === "admin")
                      }
                      onCheckedChange={(on) =>
                        toggle(person, role, on === true)
                      }
                      aria-label={`${STAFF_ROLE_INFO[role].label} for ${person.name}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="add-staff" className="flex flex-col gap-2">
        <h2 id="add-staff" className="font-medium">
          Add someone
        </h2>
        <p className="text-muted-foreground text-sm">
          They need an account first: have them sign up on the site.
        </p>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="First or last name"
          aria-label="Find an account by name"
          className="max-w-sm"
        />
        {results.length ? (
          <ul className="flex max-w-sm flex-col divide-y rounded-xl border">
            {results.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {person.name}
                  {person.organization ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {person.organization}
                    </span>
                  ) : null}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => add(person)}
                  disabled={staff.some((row) => row.id === person.id)}
                >
                  {staff.some((row) => row.id === person.id) ? "Listed" : "Add"}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
