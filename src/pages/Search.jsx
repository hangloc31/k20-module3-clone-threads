import { useState } from "react";
import instance from "../api/axios.js";

// Minimal search over GET /api/search?q= (returns topics + users).
const Search = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/api/search", { params: { q: term } });
      const body = response.data ?? {};
      setResult(body.data ?? { topics: [], users: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Không tìm kiếm được");
    } finally {
      setLoading(false);
    }
  };

  const users = result?.users ?? [];
  const topics = result?.topics ?? [];

  return (
    <div className="pt-4">
      <h1 className="font-bold text-[17px] px-1 pb-3">Tìm kiếm</h1>

      <form onSubmit={onSubmit} className="flex gap-2 mb-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm người dùng hoặc chủ đề"
          data-testid="search-input"
          className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-semibold disabled:opacity-40"
        >
          {loading ? "..." : "Tìm"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 px-2">
          {error}
        </p>
      )}

      {users.length > 0 && (
        <section className="mb-4" data-testid="search-users">
          <h2 className="text-sm font-semibold text-neutral-500 mb-2">Người dùng</h2>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 py-2 border-b border-neutral-200 dark:border-neutral-800"
            >
              <img
                src={user.avatar_url ?? "https://i.pravatar.cc/100?u=unknown"}
                alt=""
                className="w-9 h-9 rounded-full object-cover bg-neutral-200"
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-neutral-500 truncate">{user.bio}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {topics.length > 0 && (
        <section data-testid="search-topics">
          <h2 className="text-sm font-semibold text-neutral-500 mb-2">Chủ đề</h2>
          {topics.map((topic) => (
            <p key={topic.id ?? topic.name} className="py-1 text-[15px]">
              {topic.name ?? topic.title}
            </p>
          ))}
        </section>
      )}

      {result && users.length === 0 && topics.length === 0 && (
        <p className="text-sm text-neutral-500 px-2">Không tìm thấy kết quả.</p>
      )}
    </div>
  );
};

export default Search;
