import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import "./islands.css";

type SearchDoc = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: string;
};

type Props = {
  docs: SearchDoc[];
};

export default function SearchBox({ docs }: Props) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalized) {
      return [];
    }

    return docs
      .filter((doc) => {
        const haystack = `${doc.title} ${doc.description} ${doc.kind}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 6);
  }, [docs, normalized]);

  return (
    <div className="search-box">
      <Search size={16} aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜索概念、案例、人物"
        aria-label="搜索"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">
          <X size={14} />
        </button>
      )}
      {results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <a key={result.id} href={result.href}>
              <span>{result.kind}</span>
              <strong>{result.title}</strong>
              <small>{result.description}</small>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
