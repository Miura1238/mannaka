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

      const { data: pair, error } = await supabaseAdmin
        .from("pairs")
        .insert({ code, owner_device_id: deviceId, expires_at: expiresAt })
        .select("id, code, expires_at")
        .single();

      if (!error && pair) {
        // owner登録（重複してもいいように念のためチェックしたければ upsert でもOK）
        await supabaseAdmin.from("pair_members").insert({
          pair_id: pair.id,
          device_id: deviceId,
          role: "owner",
        });

        return NextResponse.json(
          { pairId: pair.id, code: pair.code, expiresAt: pair.expires_at },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ error: "failed_to_create_code" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
