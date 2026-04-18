import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data: pair, error: pairErr } = await supabaseAdmin
      .from("pairs")
      .select("id, code, expires_at")
      .eq("code", String(code))
      .gt("expires_at", now)
      .maybeSingle();

    if (pairErr) throw pairErr;
    if (!pair) {
      return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 404 });
    }

    const { error: insErr } = await supabaseAdmin
      .from("pair_members")
      .upsert(
        { pair_id: pair.id, device_id: user.id, role: "member" },
        { onConflict: "pair_id,device_id" }
      );

    if (insErr) throw insErr;

    return NextResponse.json({ pairId: pair.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
