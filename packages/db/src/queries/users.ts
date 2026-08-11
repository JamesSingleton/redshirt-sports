import { eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { usersTable } from "../schema";

export async function getUserById(id: string) {
  return db.query.usersTable.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      organization: true,
      organizationRole: true,
    },
  });
}

export async function createUser({
  id,
  firstName,
  lastName,
}: {
  id: string;
  firstName: string;
  lastName: string;
}) {
  await db.insert(usersTable).values({
    id,
    firstName,
    lastName,
  });
}

export async function updateUser({
  id,
  firstName,
  lastName,
  organization,
  organizationRole,
  isAdmin,
  isVoter,
}: {
  id: string;
  firstName: string;
  lastName: string;
  organization?: string | null;
  organizationRole?: string | null;
  isAdmin?: boolean;
  isVoter: boolean;
}) {
  await db
    .update(usersTable)
    .set({
      firstName,
      lastName,
      organization,
      organizationRole,
      isAdmin,
      isVoter,
    })
    .where(eq(usersTable.id, id));
}
