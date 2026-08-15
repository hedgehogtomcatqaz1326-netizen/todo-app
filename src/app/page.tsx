"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  starred: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [advice, setAdvice] = useState<string>("");

  // ローカルストレージからの読み込み（データ保持）
  useEffect(() => {
    const saved = localStorage.getItem("todos_data");
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // ローカルストレージへの保存
  useEffect(() => {
    localStorage.setItem("todos_data", JSON.stringify(todos));
  }, [todos]);

  if (status === "loading") {
    return <div style={{ padding: "20px", textAlign: "center" }}>読み込み中...</div>;
  }

  if (!session) {
    return (
      <div style={{ maxWidth: "400px", margin: "80px auto", padding: "20px", textAlign: "center", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "15px" }}>やることリストアプリ</h1>
        <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>Googleアカウントで安全にログインして利用できます。</p>
        <button
          onClick={() => signIn("google")}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            backgroundColor: "#4285F4",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Googleでログイン
        </button>
      </div>
    );
  }

  // タスク追加
  const addTodoText = (text: string) => {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      starred: false,
    };
    setTodos([newTodo, ...todos]);
    setInputText("");
  };

  // 機能1: 絵文字ワンタップ入力
  const handleQuickAdd = (presetText: string) => {
    addTodoText(presetText);
  };

  // 機能2: スター（重要度）トグル
  const toggleStar = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, starred: !todo.starred } : todo
      )
    );
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // 機能3: 進め方アドバイス & 検索リンク生成
  const generateAdvice = (taskText: string) => {
    setAdvice(`「${taskText}」の攻略手順:\n1. 関連情報を収集する\n2. 必要な小タスクに分解して着手する`);
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <main style={{ maxWidth: "500px", margin: "30px auto", padding: "0 15px", fontFamily: "sans-serif" }}>
      {/* ユーザー情報ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>{session.user?.name} さん</span>
        <button
          onClick={() => signOut()}
          style={{ padding: "4px 8px", fontSize: "12px", border: "1px solid #ccc", background: "#f8f9fa", borderRadius: "4px", cursor: "pointer" }}
        >
          ログアウト
        </button>
      </div>

      <h1 style={{ fontSize: "22px", textAlign: "center", marginBottom: "15px" }}>やることリスト</h1>

      {/* 進捗バー（視覚化） */}
      <div style={{ marginBottom: "20px", background: "#f0f0f0", borderRadius: "10px", padding: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
          <span>進み具合</span>
          <span>{completedCount} / {todos.length} 完了 ({progressPercent}%)</span>
        </div>
        <div style={{ height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "#28a745", transition: "width 0.3s" }}></div>
        </div>
      </div>

      {/* アイデア1: 絵文字ワンタップクイック入力 */}
      <div style={{ marginBottom: "15px" }}>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>ワンタップで追加:</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => handleQuickAdd("🛒 買い物")} style={{ padding: "6px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: "15px", cursor: "pointer", fontSize: "13px" }}>🛒 買い物</button>
          <button onClick={() => handleQuickAdd("💻 作業")} style={{ padding: "6px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: "15px", cursor: "pointer", fontSize: "13px" }}>💻 作業</button>
          <button onClick={() => handleQuickAdd("📞 連絡")} style={{ padding: "6px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: "15px", cursor: "pointer", fontSize: "13px" }}>📞 連絡</button>
          <button onClick={() => handleQuickAdd("🧹 掃除")} style={{ padding: "6px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: "15px", cursor: "pointer", fontSize: "13px" }}>🧹 掃除</button>
        </div>
      </div>

      {/* 通常入力フォーム */}
      <form onSubmit={(e) => { e.preventDefault(); addTodoText(inputText); }} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="新しいタスクを入力..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ flex: 1, padding: "10px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "6px" }}
        />
        <button type="submit" style={{ padding: "10px 16px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          追加
        </button>
      </form>

      {/* タスク一覧 */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px",
              borderBottom: "1px solid #eee",
              background: todo.completed ? "#f9f9f9" : "#fff"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              {/* アイデア2: スターフラグ */}
              <button
                onClick={() => toggleStar(todo.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: 0 }}
              >
                {todo.starred ? "⭐" : "☆"}
              </button>

              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo.id)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />

              <span style={{ textDecoration: todo.completed ? "line-through" : "none", color: todo.completed ? "#888" : "#333", fontSize: "15px" }}>
                {todo.text}
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {/* アイデア3呼び出し */}
              <button
                onClick={() => { setChatOpen(true); generateAdvice(todo.text); }}
                style={{ fontSize: "11px", padding: "4px 8px", background: "#e7f5ff", color: "#0070f3", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                ヒント
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{ fontSize: "11px", padding: "4px 8px", background: "#fff0f0", color: "#dc3545", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* アイデア3: 攻略アドバイスチャット画面 */}
      {chatOpen && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", width: "300px", background: "#fff", border: "1px solid #ccc", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "15px", zIndex: 1000 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <strong style={{ fontSize: "14px" }}>🤖 タスク攻略アシスタント</strong>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>
          <div style={{ fontSize: "13px", whiteSpace: "pre-wrap", background: "#f8f9fa", padding: "10px", borderRadius: "6px", marginBottom: "10px" }}>
            {advice || "タスクの「ヒント」ボタンを押すとアドバイスが表示されます。"}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent("タスク 効率化")}`}
              target="_blank"
              rel="noreferrer"
              style={{ flex: 1, textAlign: "center", padding: "6px", fontSize: "11px", background: "#ff0000", color: "#fff", textDecoration: "none", borderRadius: "4px" }}
            >
              YouTube検索
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent("タスク やり方")}`}
              target="_blank"
              rel="noreferrer"
              style={{ flex: 1, textAlign: "center", padding: "6px", fontSize: "11px", background: "#4285F4", color: "#fff", textDecoration: "none", borderRadius: "4px" }}
            >
              Google検索
            </a>
          </div>
        </div>
      )}
    </main>
  );
}