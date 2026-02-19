// app/api/pair/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function makeCode() {
  // 6桁（課金で8桁/英数字に拡張しやすい）
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // 期限：24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 衝突したら作り直し（最大10回）
    for (let i = 0; i < 10; i++) {
      const code = makeCode();

      const { data, error } = await supabaseAdmin
        .from("pairs")
        .insert({ code, owner_device_id: deviceId, expires_at: expiresAt })
        .select("id, code, expires_at")
        .single();

      if (!error && data) {
        // owner を members に登録（重複しても困らないように事前チェックでもOK）
        await supabaseAdmin.from("pair_members").insert({
          pair_id: data.id,
          device_id: deviceId,
          role: "owner",
        });

        return NextResponse.json(
          { pairId: data.id, code: data.code, expiresAt: data.expires_at },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ error: "failed to create code" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
