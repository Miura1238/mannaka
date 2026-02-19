// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">まんなか</h1>
        <p className="text-gray-600 text-sm">ふたりの気持ちの“まんなか”を見つけるアプリ</p>

        <div className="space-y-3">
          <Link
            href="/pair/create"
            className="block w-full rounded-xl py-3 font-medium bg-gray-900 text-white"
          >
            はじめる
          </Link>

          <Link
            href="/pair/join"
            className="block w-full rounded-xl py-3 font-medium bg-white text-gray-900 border"
          >
            コードを入力する
          </Link>
        </div>
      </div>
    </main>
  );
}
