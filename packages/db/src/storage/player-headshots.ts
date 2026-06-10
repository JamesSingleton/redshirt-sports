import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { keys } from "../../keys";
import { playersTable, type SelectPlayer } from "../schema";

const DEFAULT_BUCKET = "player-headshots";

function getSupabaseAdmin() {
  const env = keys();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getPlayerHeadshotUrl(
  player: Pick<SelectPlayer, "headshotBucket" | "headshotPath">,
): string | null {
  if (!player.headshotPath) {
    return null;
  }

  const bucket = player.headshotBucket ?? DEFAULT_BUCKET;
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucket).getPublicUrl(player.headshotPath);
  return data.publicUrl;
}

export async function uploadPlayerHeadshot(
  playerId: string,
  file: Blob | ArrayBuffer,
  contentType: string,
): Promise<string> {
  const extension = contentType.split("/")[1] ?? "jpg";
  const path = `${playerId}/headshot.${extension}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  await db
    .update(playersTable)
    .set({
      headshotBucket: DEFAULT_BUCKET,
      headshotPath: path,
      updatedAt: new Date(),
    })
    .where(eq(playersTable.id, playerId));

  return path;
}

export async function deletePlayerHeadshot(playerId: string): Promise<void> {
  const player = await db.query.playersTable.findFirst({
    where: (model, { eq: eqOp }) => eqOp(model.id, playerId),
    columns: {
      headshotBucket: true,
      headshotPath: true,
    },
  });

  if (!player?.headshotPath) {
    return;
  }

  const bucket = player.headshotBucket ?? DEFAULT_BUCKET;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(bucket).remove([player.headshotPath]);

  if (error) {
    throw error;
  }

  await db
    .update(playersTable)
    .set({
      headshotPath: null,
      updatedAt: new Date(),
    })
    .where(eq(playersTable.id, playerId));
}
