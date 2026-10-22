"use client";
// naegun-search-hard-navigation-v1

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";


type SearchItem = {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIcon: string;
};

export default function HomeProfileSearch() {
  

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();

    setItems([]);

    if (!q) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/profile-search?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("검색 실패");
        }

        const data: {
          results?: SearchItem[];
        } = await response.json();

        if (!controller.signal.aborted) {
          setItems(data.results ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function openProfile(
    gameName: string,
    tagLine: string
  ) {
    const params = new URLSearchParams({
      gameName,
      tagLine,
    });

    window.location.assign(
      `/profile-search/result?${params.toString()}`
    );
  }

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const raw = query.trim();
    if (!raw) return;

    const exact = raw.match(/^(.+?)\s*#\s*(\S+)$/);

    if (exact) {
      openProfile(
        exact[1].trim(),
        exact[2].trim()
      );
      return;
    }

    if (items.length) {
      openProfile(
        items[0].gameName,
        items[0].tagLine
      );
      return;
    }

    window.location.assign("/profile-search");
  }

  return (
    <div className="hero-search-shell">
      <form
        className="hero-search"
        onSubmit={submit}
      >
        <input
          type="text"
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
            }
          }}
          placeholder="EX) 소환사이름 #KR1"
          aria-label="소환사 이름과 태그 검색"
          autoComplete="off"
          className="hero-search-input"
        />
      </form>

      {focused && query.trim() && (
        <div className="hero-search-results">
          {loading ? (
            <div className="hero-search-message">
              검색 중입니다.
            </div>
          ) : items.length ? (
            items.slice(0, 6).map((user) => (
              <button
                type="button"
                key={user.puuid}
                className="hero-search-result"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  openProfile(
                    user.gameName,
                    user.tagLine
                  )
                }
              >
                <img
                  src={user.profileIcon}
                  alt=""
                />
                <span>
                  {user.gameName}
                  <small>#{user.tagLine}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="hero-search-message">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
