// src/app/api/pair/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6桁
}

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < 10; i++) {
      const code = makeCode();

      // ✅ テーブル名を pairs に統一
      const { data: pair, error } = await supabaseAdmin
        .from("pairs")
        .insert({ code, owner_device_id: deviceId, expires_at: expiresAt })
        .select("id, code, expires_at")
        .single();

      if (!error && pair) {
        // owner を pair_members に登録（重複しても落ちないよう upsert 推奨）
        await supabaseAdmin
          .from("pair_members")
          .upsert(
            { pair_id: pair.id, device_id: deviceId, role: "owner" },
            { onConflict: "pair_id,device_id" }
          );

        // ✅ page.tsx が欲しい形で返す
        return NextResponse.json({ code: pair.code, pairId: pair.id, expiresAt: pair.expires_at });
      }
    }

    return NextResponse.json({ error: "failed_to_create_code" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
