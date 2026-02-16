"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getDeviceId() {
  const key = "mannaka_device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

export default function DashboardPage() {
  const router = useRouter();
  const deviceId = useMemo(() => (typeof window !== "undefined" ? getDeviceId() : ""), []);
  const [error, setError] = useState<string>("");
  const [membersCount, setMembersCount] = useState<number>(0);
  const [pairId, setPairId] = useState<string>("");

  useEffect(() => {
    let timer: any;

    const tick = async () => {
      try {
        setError("");

        const res = await fetch("/api/pair/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        const text = await res.text();
        let json: any = null;
        try { json = JSON.parse(text); } catch {}

        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}: ${text}`);

        if (!json?.hasPair) {
          // ペアIDが無いならトップへ戻す（保険）
          return;
        }

        const members = json?.members ?? [];
        setMembersCount(members.length);
        setPairId(json?.pair?.id ?? "");

        // ★2人揃ったら同じ画面へ遷移（ここが目的）
        if (members.length >= 2) {
          // 行き先は仮で /paired にしてる（次で作る）
          router.replace("/paired");
        }
      } catch (e: any) {
        setError(e?.message ?? "error");
      } finally {
        timer = setTimeout(tick, 1500); // 1.5秒おきに確認
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, [deviceId, router]);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500 hover:underline">← 戻る</Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm border space-y-2">
          <h1 className="text-xl font-semibold text-gray-800">ダッシュボード</h1>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-sm text-gray-600">pairId: {pairId || "-"}</p>
          <p className="text-sm text-gray-600">参加人数: {membersCount} / 2</p>

          <p className="text-sm text-gray-500">
            2人揃ったら自動で次へ進みます…
          </p>
        </div>
      </div>
    </main>
  );
}
