import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">まんなか</h1>
        <p className="text-gray-600 text-sm">ふたりの気持ちの"まんなか"を見つけるアプリ</p>

        {user ? (
          <>
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
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                ログアウト
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-3">
            <Link
              href="/signup"
              className="block w-full rounded-xl py-3 font-medium bg-gray-900 text-white"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-xl py-3 font-medium bg-white text-gray-900 border"
            >
              ログイン
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
