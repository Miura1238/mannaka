import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const { data: membersLatest, error: mErr } = await supabaseAdmin
      .from("pair_members")
      .select("pair_id, role, created_at")
      .eq("device_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (mErr) throw mErr;

    const latest = membersLatest?.[0];
    if (!latest?.pair_id) return NextResponse.json({ hasPair: false }, { status: 200 });

    const { data: pair, error: pErr } = await supabaseAdmin
      .from("pairs")
      .select("id, code, expires_at")
      .eq("id", latest.pair_id)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!pair) return NextResponse.json({ hasPair: false }, { status: 200 });

    const { data: members, error: msErr } = await supabaseAdmin
      .from("pair_members")
      .select("device_id, role, created_at")
      .eq("pair_id", pair.id)
      .order("created_at", { ascending: true });

    if (msErr) throw msErr;

    return NextResponse.json({ hasPair: true, pair, members: members ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
