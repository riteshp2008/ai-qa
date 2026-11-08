import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export type Profile = { id: string; email: string; fullName: string | null };

export const profileRepository = {
  async findById(id: string): Promise<Profile | null> {
    const [row] = await getDb()
      .select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    return row ?? null;
  },
};
