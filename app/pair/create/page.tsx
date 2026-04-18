"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PairCreatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const existingPairId = localStorage.getItem("mannaka_pair_id");
        if (existingPairId) {
          router.replace("/paired");
          return;
        }

        const res = await fetch("/api/pair/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        setCode(json.code);
        localStorage.setItem("mannaka_pair_id", json.pairId);
        router.replace("/paired");
      } catch (e: any) {
        setError(e.message || "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        <h1 className="text-2xl font-semibold text-gray-800">コードを作成</h1>
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          {loading && <p className="text-gray-500">作成中…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="text-4xl tracking-widest font-bold text-gray-900">{code}</div>
          )}
        </div>
      </div>
    </main>
  );
}
