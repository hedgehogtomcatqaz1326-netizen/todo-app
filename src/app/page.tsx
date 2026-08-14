"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  starred?: boolean;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  links?: { title: string; url: string }[];
}

export default function Home() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const status = sessionResult?.status ?? "loading";

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "こんにちは！タスク攻略アシスタントです。タスクの進め方に迷ったら「攻略法を探す」を押すか、「〜のコツを教えて」と送ってくださいね！",
    },
  ]);

  const quickEmojiTasks = [
    { label: "🛒 買い物", text: "🛒 買い出しに行く" },
    { label: "📞 連絡", text: "📞 メール/電話を返す" },
    { label: "💻 作業", text: "💻 タスク・資料作成" },
    { label: "🏃 運動", text: "🏃 軽い運動・散歩" },
    { label: "☕ 休憩", text: "☕ リフレッシュ休憩" },
  ];

  useEffect(() => {
    if (session?.user) {
      fetchTodos();
    }
  }, [session]);

  const fetchTodos = async () => {
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (!gasUrl || !session?.user?.email) return;
    try {
      setLoading(true);
      const res = await fetch(`${gasUrl}?action=get&userEmail=${encodeURIComponent(session.user.email)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTodos(data);
      }
    } catch (e) {
      console.error("取得エラー:", e);
      setErrorMessage("データの読み込みに失敗しました。ページを再読み込みしてください。");
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e?: React.FormEvent, customTitle?: string) => {
    if (e) e.preventDefault();
    const titleToAdd = customTitle || newTodo;

    if (!titleToAdd.trim()) {
      setErrorMessage("タスク内容が空です。文字を入力するか絵文字ボタンを押してください。");
      return;
    }
    setErrorMessage("");

    if (!session?.user?.email) return;

    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    const tempTodo: Todo = { id: Date.now().toString(), title: titleToAdd, completed: false, starred: false };
    
    setTodos((prev) => [...prev, tempTodo]);
    setNewTodo("");

    if (gasUrl) {
      try {
        const params = new URLSearchParams();
        params.append("action", "add");
        params.append("userEmail", session.user.email);
        params.append("id", tempTodo.id);
        params.append("title", titleToAdd);

        await fetch(gasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (e) {
        console.error("追加エラー:", e);
        setErrorMessage("送信中に通信エラーが発生しました。");
      }
    }
  };

  const toggleTodo = async (id: string, currentCompleted: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !currentCompleted } : t))
    );
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (gasUrl && session?.user?.email) {
      try {
        const params = new URLSearchParams();
        params.append("action", "toggle");
        params.append("userEmail", session.user.email);
        params.append("id", id);
        params.append("completed", String(!currentCompleted));

        await fetch(gasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (e) {
        console.error("更新エラー:", e);
      }
    }
  };

  const toggleStar = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (gasUrl && session?.user?.email) {
      try {
        const params = new URLSearchParams();
        params.append("action", "delete");
        params.append("userEmail", session.user.email);
        params.append("id", id);

        await fetch(gasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (e) {
        console.error("削除エラー:", e);
      }
    }
  };

  const handleTaskGuideReply = (userQuery: string): ChatMessage => {
    const activeTodos = todos.filter((t) => !t.completed);
    const targetQuery = userQuery.trim();

    const keyword = activeTodos.length > 0 ? activeTodos[0].title : targetQuery;
    const cleanKeyword = keyword.replace(/[🛒📞💻🏃☕]/g, "").trim();

    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + " やり方 効率化")}`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanKeyword + " コツ 手順")}`;

    let replyText = "";
    if (activeTodos.length > 0) {
      replyText = `現在のタスク「${activeTodos[0].title}」の攻略手順と参考動画を用意しました！\n\n💡 **進め方のアドバイス**:\n1. まずは必要な準備物を手元に揃える\n2. 5分間だけ集中して手を付けてみる\n3. 以下のリンクから具体的な手順・動画を確認する`;
    } else {
      replyText = `「${cleanKeyword}」の攻略情報・解説動画を検索しました！以下のリンクから確認できます。`;
    }

    return {
      sender: "bot",
      text: replyText,
      links: [
        { title: `▶️ YouTubeで「${cleanKeyword}」の解説動画を見る`, url: youtubeUrl },
        { title: `🔍 Googleで「${cleanKeyword}」のコツ・手順を検索`, url: googleUrl },
      ],
    };
  };

  const handleSendChat = (customText?: string) => {
    const text = customText || chatInput;
    if (!text.trim()) return;

    const userMsg: ChatMessage = { sender: "user", text };
    let botMsg: ChatMessage;

    if (text.includes("動画") || text.includes("攻略") || text.includes("やり方") || text.includes("コツ") || text.includes("どうすれば")) {
      botMsg = handleTaskGuideReply(text);
    } else {
      botMsg = {
        sender: "bot",
        text: `「${text}」ですね！\nタスクの進め方や解説動画を見たい場合は、「🎬 攻略・動画を探す」ボタンを押してみてください！`,
      };
    }

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!customText) setChatInput("");
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500 font-medium">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full text-center border">
          <h1 className="text-2xl font-bold mb-3 text-gray-800">スマート ToDo</h1>
          <p className="text-gray-600 text-sm mb-6">
            Googleアカウントでサインインして、効率的なタスク管理を開始しましょう。
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow transition duration-200"
          >
            Googleでサインイン（1クリック）
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 relative pb-24">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 border">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-800">マイ ToDo</h1>
            <p className="text-xs text-gray-500">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-red-500 font-semibold hover:underline"
          >
            ログアウト
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex justify-between items-center">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="font-bold ml-2">×</button>
          </div>
        )}

        <form onSubmit={addTodo} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => {
              setNewTodo(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="新しいタスクを入力..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            追加
          </button>
        </form>

        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1.5">ワンタップでクイック追加:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickEmojiTasks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => addTodo(undefined, item.text)}
                className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-6">タスクを読み込み中...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">タスクはありません。</p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => toggleStar(todo.id)}
                    className="text-base leading-none focus:outline-none"
                    title="重要度を設定"
                  >
                    {todo.starred ? "⭐" : "☆"}
                  </button>

                  <span
                    className={`text-sm ${
                      todo.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-5 right-5 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg transition flex items-center gap-2 text-sm font-medium"
          >
            <span className="text-lg">🤖</span>
            <span>タスク攻略ヘルプ</span>
          </button>
        ) : (
          <div className="bg-white border rounded-xl shadow-2xl w-80 sm:w-96 flex flex-col h-96 overflow-hidden transition">
            <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-bold">タスク攻略アシスタント</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-gray-200 text-lg font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.links && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                        {msg.links.map((link, lIdx) => (
                          <a
                            key={lIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-semibold block bg-blue-50 p-1.5 rounded text-[11px]"
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 border-t bg-white flex gap-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSendChat("タスクの攻略法や動画を探して")}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded whitespace-nowrap border border-blue-200 font-medium"
              >
                🎬 攻略・動画を探す
              </button>
              <button
                onClick={() => handleSendChat("どうすればいい？")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded whitespace-nowrap border"
              >
                💡 進め方アドバイス
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-2 border-t bg-white flex gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="例: 資料作成の動画を探して..."
                className="flex-1 border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition"
              >
                送信
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}