"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PairedPage() {
  const router = useRouter();
  const [pairId, setPairId] = useState("");
  const [count, setCount] = useState<number>(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mannaka_pair_id") || "";
    setPairId(stored);
  }, []);

  useEffect(() => {
    if (!pairId) return;

    let timer: any = null;
    let cancelled = false;

    const tick = async () => {
      try {
        setError("");
        const res = await fetch("/api/pair/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!json?.hasPair) return;

        const memberCount = (json.members ?? []).length;
        if (!cancelled) {
          setCount(memberCount);
          setCode(json.pair?.code ?? "");
        }

        if (memberCount >= 2) {
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
  }, [pairId, router]);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500">← 戻る</Link>

        <div className="rounded-2xl border bg-white p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-800">相手を待っています…</h1>
          <p className="text-sm text-gray-500">コードを相手に送って、参加してもらいましょう</p>
          {code && (
            <p className="text-4xl font-bold tracking-widest text-gray-900">{code}</p>
          )}
          <p className="text-2xl font-bold text-gray-400">{count} / 2</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
