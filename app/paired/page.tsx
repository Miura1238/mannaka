// app/paired/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getDeviceId() {
  const key = "mannaka_device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

export default function PairedPage() {
  const router = useRouter();
  const deviceId = useMemo(() => (typeof window !== "undefined" ? getDeviceId() : ""), []);
  const [pairId, setPairId] = useState("");
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mannaka_pair_id") || "";
    setPairId(stored);
  }, []);

  useEffect(() => {
    if (!pairId && !deviceId) return;

    let timer: any = null;
    let cancelled = false;

    const tick = async () => {
      try {
        setError("");
        const res = await fetch("/api/pair/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairId: pairId || null, deviceId: deviceId || null }),
        });

        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}: ${text}`);
        if (!json?.hasPair) return;

        const members = json.members ?? [];
        const memberCount = members.length;
        if (!cancelled) setCount(memberCount);

        // 2人揃ったら進む
        if (memberCount >= 2) {
          // 念のためpairIdを保存
          localStorage.setItem("mannaka_pair_id", json.pair.id);
          router.push("/dashboard");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "エラーが発生しました");
      }
    };

    tick();
    timer = setInterval(tick, 1500);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [pairId, deviceId]);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500">
          ← 戻る
        </Link>

        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-800">ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600 break-all">pairId: {pairId || "（未取得）"}</p>
          <p className="mt-1 text-sm text-gray-600">参加人数: {count} / 2</p>
          <p className="mt-3 text-xs text-gray-500">2人揃ったら自動で次へ進みます…</p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
