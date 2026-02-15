import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function makeCode() {
  // 6桁コード
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId required" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    // 最大10回衝突回避
    for (let i = 0; i < 10; i++) {
      const code = makeCode();

      const { data, error } = await supabaseAdmin
        .from("pairs")
        .insert({
          code,
          owner_device_id: deviceId,
          expires_at: expiresAt,
        })
        .select("id, code, expires_at")
        .single();

      if (!error && data) {
        // ownerをpair_membersへ登録
        await supabaseAdmin.from("pair_members").insert({
          pair_id: data.id,
          device_id: deviceId,
          role: "owner",
        });

        return NextResponse.json({
          code: data.code,
          pairId: data.id,
          expiresAt: data.expires_at,
        });
      }
    }

    return NextResponse.json(
      { error: "failed to create code" },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "unexpected error" },
      { status: 500 }
    );
  }
}
