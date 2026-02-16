"use client";

import { useEffect, useState } from "react";
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

export default function PairedPage() {
  const router = useRouter();
  const [pairId, setPairId] = useState<string>("");
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const deviceId = getDeviceId();

    const tick = async () => {
      try {
        setError("");
        const res = await fetch("/api/pair/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        if (!json.hasPair) {
          setCount(0);
          setPairId("");
          return;
        }

        setPairId(json.pair?.id || "");
        const members = json.members ?? [];
        setCount(members.length);

        // ★ 2人揃ったら次へ
        if (members.length >= 2) {
          router.replace("/dashboard");
        }
      } catch (e: any) {
        setError(e.message || "エラーが発生しました");
      }
    };

    tick();
    const id = setInterval(tick, 1500);
    return () => clearInterval(id);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500">← 戻る</Link>

        <div className="rounded-2xl border bg-white p-6 space-y-2">
          <h1 className="text-xl font-semibold text-gray-800">ダッシュボード</h1>
          <p className="text-xs text-gray-500 break-all">pairId: {pairId || "(未取得)"}</p>
          <p className="text-sm text-gray-700">参加人数: {count} / 2</p>
          <p className="text-sm text-gray-500">2人揃ったら自動で次へ進みます…</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
