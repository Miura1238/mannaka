// app/pair/join/page.tsx
"use client";

import { useMemo, useState } from "react";
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

export default function PairJoinPage() {
  const router = useRouter();
  const deviceId = useMemo(() => (typeof window !== "undefined" ? getDeviceId() : ""), []);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = code.trim().length > 0 && !loading;

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pair/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), deviceId }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const msg =
          json?.error === "invalid_or_expired_code"
            ? "コードが無効、または期限切れです"
            : json?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      localStorage.setItem("mannaka_pair_id", json.pairId);
      router.push("/paired");
    } catch (e: any) {
      setError(e?.message ?? "参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm text-gray-500">
          ← 戻る
        </Link>

        <h1 className="text-2xl font-semibold text-gray-800">コードを入力</h1>

        <div className="rounded-2xl border border-gray-300 bg-white p-5 space-y-3">
          <p className="text-sm text-gray-600">相手から受け取ったコードを入力してください</p>

          <input
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="例）378058"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
          />

          <button
            className={`w-full rounded-xl py-3 font-medium ${
              canSubmit ? "bg-gray-800 text-white" : "bg-gray-300 text-gray-600"
            }`}
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {loading ? "参加中..." : "参加する"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
