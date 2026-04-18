import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < 10; i++) {
      const code = makeCode();

      const { data: pair, error } = await supabaseAdmin
        .from("pairs")
        .insert({ code, owner_device_id: userId, expires_at: expiresAt })
        .select("id, code, expires_at")
        .single();

      if (!error && pair) {
        await supabaseAdmin
          .from("pair_members")
          .upsert(
            { pair_id: pair.id, device_id: userId, role: "owner" },
            { onConflict: "pair_id,device_id" }
          );

        return NextResponse.json({ code: pair.code, pairId: pair.id, expiresAt: pair.expires_at });
      }
    }

    return NextResponse.json({ error: "failed_to_create_code" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
