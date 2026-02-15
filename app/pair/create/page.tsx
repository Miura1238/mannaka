"use client";

import { useEffect, useState } from "react";
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

export default function PairCreatePage() {
  const [code, setCode] = useState<string>("");
  const [pairId, setPairId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const deviceId = getDeviceId();

        const res = await fetch("/api/pair/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "エラーが発生しました");
        }

        setCode(json.code);
        setPairId(json.pairId);
      } catch (e: any) {
        setError(e.message || "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:underline"
        >
          ← 戻る
        </Link>

        <h1 className="text-2xl font-semibold text-gray-800">
          コードを作成
        </h1>

        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          {loading && (
            <p className="text-gray-500">作成中…</p>
          )}

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          {!loading && !error && (
            <>
              <p className="text-gray-600 text-sm">
                相手にこのコードを送ってください
              </p>

              <div className="mt-3 text-4xl tracking-widest font-bold text-gray-900">
                {code}
              </div>

              {/* デバッグ用。不要なら削除OK */}
              <p className="mt-3 text-xs text-gray-400 break-all">
                pairId: {pairId}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
