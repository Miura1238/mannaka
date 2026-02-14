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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const deviceId = getDeviceId();
        const res = await fetch("/api/pair/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setData(json);
      } catch (e: any) {
        setError(e.message ?? "読み込み失敗");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <main className="min-h-screen bg-[#F7F5F2] p-6">読み込み中...</main>;
  if (error) return <main className="min-h-screen bg-[#F7F5F2] p-6 text-red-600">{error}</main>;

  if (!data?.hasPair) {
    return (
      <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">まだペアがありません</h1>
          <div className="space-y-2">
            <Link className="block w-full rounded-xl bg-gray-800 text-white py-3" href="/pair/create">
              コードを作る
            </Link>
            <Link className="block w-full rounded-xl border border-gray-300 bg-white py-3" href="/pair/join">
              コードを入力する
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const members = data.members ?? [];
  const isReady = members.length >= 2;

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500">← 戻る</Link>

        <div className="rounded-2xl border border-gray-300 bg-white p-5 space-y-3">
          <h1 className="text-xl font-semibold text-gray-800">ダッシュボード</h1>

          <div className="text-sm text-gray-600">
            <div>pairId: <span className="font-mono">{data.pair?.id}</span></div>
            <div>code: <span className="font-mono">{data.pair?.code}</span></div>
          </div>

          <div className={`rounded-xl p-3 ${isReady ? "bg-green-50" : "bg-yellow-50"}`}>
            {isReady ? (
              <p className="text-sm text-green-800">✅ ペア成立！</p>
            ) : (
              <p className="text-sm text-yellow-800">⌛ 相手の参加を待っています…</p>
            )}
          </div>

          <div className="text-sm text-gray-700">
            <p className="font-medium">メンバー</p>
            <ul className="mt-2 space-y-1">
              {members.map((m: any) => (
                <li key={m.device_id} className="flex justify-between">
                  <span className="font-mono text-xs">{m.device_id}</span>
                  <span className="text-xs">{m.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
