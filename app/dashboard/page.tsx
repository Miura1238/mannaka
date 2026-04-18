"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  label: string;
};

const TASKS: Task[] = [
  { id: "diaper", label: "おむつ" },
  { id: "bath", label: "おふろ" },
  { id: "meal", label: "ごはん" },
  { id: "sleep", label: "寝かしつけ" },
  { id: "pickup", label: "お迎え" },
  { id: "laundry", label: "洗濯" },
  { id: "dishes", label: "食器" },
  { id: "clean", label: "掃除" },
];

type LogItem = {
  id: string;
  taskId: string;
  at: number;
};

type SavedLetter = {
  weekStart: number;
  text: string;
  createdAt: number;
};

const LS_KEYS = {
  memo: "mannaka:memo",
  ask: "mannaka:ask",
  plan: "mannaka:plan",
  logs: "mannaka:logs",
  letter: "mannaka:letter",
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getTaskLabel(taskId: string) {
  return TASKS.find((t) => t.id === taskId)?.label ?? taskId;
}

function summarizeWeek(weekLogs: LogItem[]) {
  const total = weekLogs.length;

  if (total === 0) {
    return {
      total,
      index: "🟢",
      status: "まだ記録なし",
      comment: "今週はまだ記録がありません。忙しかっただけかも。できる日だけ、ひとつ押せたら十分です。",
      top: null,
    };
  }

  const counts = new Map<string, number>();
  weekLogs.forEach((l) => counts.set(l.taskId, (counts.get(l.taskId) ?? 0) + 1));

  const values = [...counts.values()];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min;

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const topId = sorted[0]?.[0] ?? null;
  const topCount = sorted[0]?.[1] ?? 0;

  let index = "🟢";
  let status = "ちょうどいい";
  let comment = "今週はバランスよく分けられていそうです。この調子で。";

  if (spread >= 5) {
    index = "🔴";
    status = "かなり偏り";
    comment = "今週はかなり偏り気味かも。でも、それだけ誰かが踏ん張ってる証拠です。少しだけ整えられたら十分。";
  } else if (spread >= 3) {
    index = "🟡";
    status = "すこし偏り";
    comment = "今週は少し偏りがあるかも。どちらも頑張ってるので、無理のない範囲で整えていきましょう。";
  }

  return {
    total,
    index,
    status,
    comment,
    top: topId ? { id: topId, count: topCount } : null,
  };
}

function buildMannakaLetter(weekLogs: LogItem[]) {
  if (weekLogs.length === 0) {
    return [
      "まんなかレター 🌿",
      "",
      "今週はまだ記録がありませんでした。",
      "でも、それだけ忙しかったのかも。",
      "できる日だけ、ひとつ押せたら十分です。",
    ].join("\n");
  }

  const counts = new Map<string, number>();
  weekLogs.forEach((l) => counts.set(l.taskId, (counts.get(l.taskId) ?? 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const topId = sorted[0]?.[0];
  const topCount = sorted[0]?.[1] ?? 0;
  const topLabel = topId ? getTaskLabel(topId) : "タスク";
  const total = weekLogs.length;

  const lines: string[] = [
    "まんなかレター 🌿",
    "",
    `今週の記録は ${total} 回。`,
    `いちばん多かったのは「${topLabel}」（${topCount}回）でした。`,
    "",
    "どちらも頑張ってる週だったと思います。",
    "完璧じゃなくて大丈夫。",
    "できた分だけ、ちゃんと前に進んでます。",
    "",
  ];

  if (topId === "sleep") lines.push("寝かしつけ多め…それだけで今週のMVPです。");
  if (topId === "diaper") lines.push("おむつ多めの週、地味に消耗しますよね。水分とってね。");
  if (topId === "bath") lines.push("おふろ担当、多いと体力使うやつ。今日はゆるめでOK。");
  if (topId === "meal") lines.push("ごはん回し、おつかれさま。買う・作る・片付ける全部えらい。");
  if (topId === "pickup") lines.push("お迎え多め…移動と調整、ほんとおつかれ。");
  if (topId === "laundry") lines.push("洗濯多め、終わらないやつ。回した時点で勝ち。");
  if (topId === "dishes") lines.push("食器多め、名もなき家事の代表。ありがとう。");
  if (topId === "clean") lines.push("掃除多め、家の空気が変わるやつ。ナイス。");

  lines.push("");
  lines.push("来週の作戦：");
  lines.push("「しんどいタスクを1個だけ、ふたりで相談して入れ替える」");
  lines.push("それだけで、かなり楽になります。");

  return lines.join("\n");
}

export default function Dashboard() {
  const [memo, setMemo] = useState("");
  const [ask, setAsk] = useState("");
  const [plan, setPlan] = useState("");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [letter, setLetter] = useState<SavedLetter | null>(null);
  const [myEmail, setMyEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setMyEmail(user.email);
    });

    fetch("/api/pair/status", { method: "POST" })
      .then((r) => r.json())
      .then((json) => {
        if (!json?.hasPair) return;
        const members: { device_id: string }[] = json.members ?? [];
        if (members.length >= 2) {
          setPaired(true);
          // 相手のuser_idからメールアドレスを取得（簡易表示用）
          supabase.auth.getUser().then(({ data: { user } }) => {
            const partner = members.find((m) => m.device_id !== user?.id);
            if (partner) setPartnerEmail(partner.device_id.slice(0, 8) + "…");
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMemo(localStorage.getItem(LS_KEYS.memo) ?? "");
    setAsk(localStorage.getItem(LS_KEYS.ask) ?? "");
    setPlan(localStorage.getItem(LS_KEYS.plan) ?? "");
    try {
      const raw = localStorage.getItem(LS_KEYS.logs);
      setLogs(raw ? (JSON.parse(raw) as LogItem[]) : []);
    } catch { setLogs([]); }
    try {
      const rawLetter = localStorage.getItem(LS_KEYS.letter);
      setLetter(rawLetter ? (JSON.parse(rawLetter) as SavedLetter) : null);
    } catch { setLetter(null); }
  }, []);

  useEffect(() => { localStorage.setItem(LS_KEYS.memo, memo); }, [memo]);
  useEffect(() => { localStorage.setItem(LS_KEYS.ask, ask); }, [ask]);
  useEffect(() => { localStorage.setItem(LS_KEYS.plan, plan); }, [plan]);
  useEffect(() => { localStorage.setItem(LS_KEYS.logs, JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem(LS_KEYS.letter, JSON.stringify(letter)); }, [letter]);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekLogs = useMemo(() => logs.filter((l) => l.at >= weekStart), [logs, weekStart]);
  const weekCount = weekLogs.length;
  const summary = useMemo(() => summarizeWeek(weekLogs), [weekLogs]);

  function addLog(taskId: string) {
    const item: LogItem = { id: crypto.randomUUID(), taskId, at: Date.now() };
    setLogs((prev) => [item, ...prev]);
  }

  function makeLetter() {
    const text = buildMannakaLetter(weekLogs);
    setLetter({ weekStart, text, createdAt: Date.now() });
  }

  function clearAll() {
    if (!confirm("ボードと記録をリセットします。よろしいですか？")) return;
    setMemo(""); setAsk(""); setPlan(""); setLogs([]); setLetter(null);
  }

  return (
    <main className="min-h-screen bg-[#F7F5F2] px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700">まんなかボード</h1>
            <p className="text-gray-500 text-sm mt-1">今日のことを少しだけ整える場所。</p>
          </div>
          <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-4">
            リセット
          </button>
        </div>

        {/* pair status */}
        <div className="flex items-center justify-center gap-4">
          {/* 相手 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${paired ? "bg-[#A8C3A0]" : "bg-gray-200"}`}>
              {paired ? partnerEmail.slice(0, 1).toUpperCase() : "?"}
            </div>
            <span className="text-xs text-gray-400">{paired ? "相手" : "未接続"}</span>
          </div>

          {/* connector */}
          <div className="flex items-center gap-1">
            <div className={`h-0.5 w-8 ${paired ? "bg-[#A8C3A0]" : "bg-gray-200"}`} />
            <div className={`text-lg ${paired ? "text-[#A8C3A0]" : "text-gray-200"}`}>♡</div>
            <div className={`h-0.5 w-8 ${paired ? "bg-[#A8C3A0]" : "bg-gray-200"}`} />
          </div>

          {/* 自分 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold bg-gray-700">
              {myEmail.slice(0, 1).toUpperCase() || "?"}
            </div>
            <span className="text-xs text-gray-400">あなた</span>
          </div>
        </div>

        {/* board */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <div className="text-sm text-gray-500">今日のメモ</div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例）夜は予防接種の問診票を準備"
              className="w-full min-h-[90px] rounded-xl border border-gray-200 px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3A0]"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">今日のお願い（1つでOK）</div>
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="例）おふろお願いしてもいい？"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3A0]"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">今日の予定（1行）</div>
              <input
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="例）15:00 小児科 / 20:30 ねんね"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3A0]"
              />
            </div>
          </div>
        </section>

        {/* weekly mannaka */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">今週のまんなか</h2>
              <p className="text-sm text-gray-500 mt-1">今週のバランス指数</p>
            </div>
            <div className="text-right">
              <div className="text-3xl">{summary.index}</div>
              <div className="text-sm text-gray-500">{summary.status}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-6">{summary.comment}</p>
        </section>

        {/* mannaka letter */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">まんなかレター</h2>
              <p className="text-sm text-gray-500 mt-1">今週の記録から、短い手紙をつくります。</p>
            </div>
            <button
              onClick={makeLetter}
              className="bg-[#A8C3A0] hover:bg-[#96B88D] text-white px-4 py-2 rounded-xl transition text-sm"
            >
              レターを作る
            </button>
          </div>
          {letter?.weekStart === weekStart ? (
            <pre className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-[#FAFAF9] p-4 text-sm text-gray-700 leading-6">
              {letter.text}
            </pre>
          ) : (
            <div className="text-sm text-gray-400">
              まだ今週のレターはありません。「レターを作る」を押してみてね。
            </div>
          )}
        </section>

        {/* tasks */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">タスク（ワンタップ）</h2>
              <p className="text-sm text-gray-500">やったら押す。それだけ。</p>
            </div>
            <div className="text-sm text-gray-500">
              今週の記録：<span className="font-semibold text-gray-700">{weekCount}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TASKS.map((t) => (
              <button
                key={t.id}
                onClick={() => addLog(t.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#A8C3A0] hover:shadow transition px-4 py-4 text-gray-700"
              >
                <div className="text-base font-medium">{t.label}</div>
                <div className="text-xs text-gray-400 mt-1">タップで記録</div>
              </button>
            ))}
          </div>
        </section>

        {/* recent */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">最近の記録</h2>
            <div className="text-xs text-gray-400">直近8件</div>
          </div>
          <div className="mt-4 space-y-2">
            {weekLogs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-gray-700">{getTaskLabel(l.taskId)}</div>
                <div className="text-sm text-gray-400">{new Date(l.at).toLocaleString()}</div>
              </div>
            ))}
            {weekLogs.length === 0 && (
              <div className="text-gray-400 text-sm">まだ記録がありません。ひとつ押してみよう。</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
