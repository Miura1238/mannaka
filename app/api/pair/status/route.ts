// src/app/api/pair/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // deviceId が所属してるペア（最新1件）を探す
    const { data: member, error: mErr } = await supabaseAdmin
      .from("pair_members")
      .select("pair_id, role, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1) // ★これが必須
      .maybeSingle();

    if (mErr) throw mErr;
    if (!member) {
      return NextResponse.json({ hasPair: false }, { status: 200 });
    }

    // ★テーブル名は create と合わせて "pairs" に統一
    const { data: pair, error: pErr } = await supabaseAdmin
      .from("pairs")
      .select("id, code, expires_at, owner_device_id, created_at")
      .eq("id", member.pair_id)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!pair) {
      return NextResponse.json({ hasPair: false }, { status: 200 });
    }

    const { data: members, error: msErr } = await supabaseAdmin
      .from("pair_members")
      .select("device_id, role, created_at")
      .eq("pair_id", pair.id)
      .order("created_at", { ascending: true });

    if (msErr) throw msErr;

    return NextResponse.json(
      {
        hasPair: true,
        pair,
        members: members ?? [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
