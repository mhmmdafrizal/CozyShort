"use client";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import "./globals.css";

type HistoryEntry = { short: string; original: string; at: number };

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => void listeners.delete(cb);
};
const bump = () => listeners.forEach((cb) => cb());
const emptyHistory: HistoryEntry[] = [];

let historyRaw = "";
let historyParsed: HistoryEntry[] = [];
function readHistory(): HistoryEntry[] {
    const raw = localStorage.getItem("history") ?? "";
    if (raw !== historyRaw) {
        historyRaw = raw;
        try {
            historyParsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
        } catch {
            historyParsed = [];
        }
    }
    return historyParsed;
}

function readTheme(): boolean {
    const stored = localStorage.getItem("theme");
    return stored === "dark" || (stored === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

const isUrl = (value: string) => {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
};

export default function Home() {
    const [url, setUrl] = useState("");
    const [shortenedUrl, setShortenedUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const history = useSyncExternalStore(subscribe, readHistory, () => emptyHistory);
    const dark = useSyncExternalStore(subscribe, readTheme, () => false);

    useEffect(() => {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
    }, [dark]);

    const saveHistory = (entry: HistoryEntry) => {
        const next = [entry, ...readHistory().filter((h) => h.short !== entry.short)].slice(0, 8);
        localStorage.setItem("history", JSON.stringify(next));
        bump();
    };

    const clearHistory = () => {
        setConfirmClear(true);
    };

    const doClearHistory = () => {
        localStorage.removeItem("history");
        setShortenedUrl("");
        setConfirmClear(false);
        bump();
    };

    async function shortURL(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const clean = url.trim();
        if (!clean) {
            setError("Enter a URL first.");
            return;
        }
        // reject unknown schemes (javascript:, file:, data:) BEFORE prefixing —
        // otherwise `file:///etc/passwd` becomes `https://file:///etc/passwd` and passes isUrl
        const scheme = clean.match(/^([a-z][a-z0-9+.-]*):/i)?.[1];
        if (scheme && !/^https?$/i.test(scheme)) {
            setError(`"${clean}" doesn't look like a valid URL.`);
            return;
        }
        const withScheme = scheme ? clean : `https://${clean}`;
        if (!isUrl(withScheme)) {
            setError(`"${clean}" doesn't look like a valid URL.`);
            return;
        }
        setError("");
        setLoading(true);
        setCopied(false);
        try {
            const response = await fetch(`/api/shorten?url=${encodeURIComponent(withScheme)}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const short = (await response.text()).trim();
            setShortenedUrl(short);
            saveHistory({ short, original: withScheme, at: Date.now() });
        } catch {
            setShortenedUrl("");
            setError("Couldn't shorten that URL. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setError("Your browser blocked clipboard access.");
        }
    }

    const current = history.find((h) => h.short === shortenedUrl);

    return (
        <div className="app-shell">
            <button
                className="theme-toggle"
                onClick={() => {
                    localStorage.setItem("theme", dark ? "light" : "dark");
                    bump();
                }}
                aria-label="Toggle theme"
                title="Toggle theme"
            >
                {dark ? "☀️" : "🌙"}
            </button>

            <main className="card">
                <p className="logo">CozyShort</p>
                <h1>URL Shortener</h1>
                <p className="subtitle">Paste a long link, grab a cozy short one.</p>

                <form className="url-form" onSubmit={shortURL}>
                    <div className="input-row">
                        <input
                            className="url-input"
                            type="text"
                            placeholder="https://example.com/some/long/path"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            spellCheck={false}
                            autoFocus
                        />
                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? "⏳ Working…" : "Shorten"}
                        </button>
                    </div>
                    {error && <div className="error-box" role="alert">{error}</div>}
                </form>

                {shortenedUrl && (
                    <div className="result">
                        <div className="result-label" title={current?.original}>
                            {current ? current.original : "Shortened link"}
                        </div>
                        <a
                            className="result-link"
                            href={shortenedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {shortenedUrl}
                        </a>
                        <button
                            className={`copy-btn${copied ? " copied" : ""}`}
                            onClick={() => copy(shortenedUrl)}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                )}

                {history.length > 0 && (
                    <section className="history">
                                <h2>Recent links</h2>
                                <button className="icon-btn" onClick={clearHistory} title="Clear history">🗑️</button>
                        <div className="history-list">
                            {history.map((h) => (
                                <div className="history-item" key={h.short}>
                                    <a
                                        className="history-link"
                                        href={h.short}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={h.original}
                                    >
                                        {h.short}
                                    </a>
                                    <div className="history-actions">
                                        <button
                                            className="icon-btn"
                                            onClick={() => copy(h.short)}
                                            title="Copy"
                                        >
                                            📋
                                        </button>
                                        <a
                                            className="icon-btn"
                                            href={h.short}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open"
                                        >
                                            ↗️
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {confirmClear && (
                <div className="modal-backdrop" onClick={() => setConfirmClear(false)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <p>Clear recent links?</p>
                        <div className="modal-actions">
                            <button onClick={() => setConfirmClear(false)}>Cancel</button>
                            <button className="danger" onClick={doClearHistory}>Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}