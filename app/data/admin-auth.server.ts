import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function hasShowroomOwnerMembership(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("showroom_owners")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Showroom owner verification failed:", {
      code: error.code,
    });
    throw new Error("Unable to verify showroom owner access.");
  }

  return data !== null;
}

export const requireShowroomOwner = cache(async () => {
  if (process.env.MOCK_DATA) {
    // Preview demo: open the admin without a Supabase login.
    const { cookies } = await import("next/headers");
    await cookies();
    return { id: "demo", email: "demo@mazighauto.dz" as string | null };
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  if (!(await hasShowroomOwnerMembership(supabase, user.id))) {
    redirect("/admin/access-denied");
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
});