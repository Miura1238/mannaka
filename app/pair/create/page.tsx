// app/pair/create/page.tsx
"use client";

import { useEffect, useState } from "react";
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

export default function PairCreatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pairId, setPairId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        if (!res.ok) {
          throw new Error(json?.error || `HTTP ${res.status}: ${text}`);
        }

        setCode(json.code);
        setPairId(json.pairId);

        // 重要：この端末のpairIdを保存
        localStorage.setItem("mannaka_pair_id", json.pairId);

      } catch (e: any) {
        setError(e?.message || "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 戻る
        </Link>

        <h1 className="text-2xl font-semibold text-gray-800">コードを作成</h1>

        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          {loading && <p className="text-gray-500">作成中…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <>
              <p className="text-gray-600 text-sm">相手にこのコードを送ってください</p>
              <div className="mt-3 text-4xl tracking-widest font-bold text-gray-900">
                {code}
              </div>
              <p className="mt-3 text-xs text-gray-400 break-all">pairId: {pairId}</p>

              <button
                className="mt-5 w-full rounded-xl py-3 font-medium bg-gray-800 text-white"
                onClick={() => router.push("/paired")}
              >
                送ったので待機する
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
