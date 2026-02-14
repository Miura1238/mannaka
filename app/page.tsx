import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-gray-800">まんなか</h1>
          <p className="text-sm text-gray-600">
            ふたりの気持ちの“まんなか”を見つけるアプリ
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/pair/create"
            className="block w-full rounded-xl bg-black text-white py-4 text-lg font-medium shadow-sm hover:opacity-90 transition"
          >
            はじめる
          </Link>

          <Link
            href="/pair/join"
            className="block w-full rounded-xl border border-gray-400 bg-white text-gray-800 py-4 text-lg font-medium shadow-sm hover:bg-gray-50 transition"
          >
            コードを入力する
          </Link>
        </div>
      </div>
    </main>
  );
}
