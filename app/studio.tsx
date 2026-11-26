"use client";

import { useEffect, useRef, useState } from "react";
import {
  finishImage,
  isPortraitFrame,
  loadImage,
  prepareUpload,
  renderPreview,
  type Mode,
} from "@/lib/browser-image";
import type { FailureCode } from "@/lib/failure";
import { OUTPUT } from "@/lib/frame";

type Phase = "empty" | "ready" | "working" | "done";
type Problem = FailureCode | "unreadable" | "offline" | "share";
type Result = { file: File; url: string; shareable: boolean };

const PASSWORD_KEY = "hochformat-passwort";

const MESSAGES: Record<Problem, string> = {
  password: "Das Passwort stimmt nicht.",
  "no-password-set":
    "Die App ist noch nicht eingerichtet: In Vercel fehlt die Variable APP_PASSWORD.",
  "bad-photo": "Dieses Foto lässt sich nicht verarbeiten. Wähle ein anderes.",
  "too-large": "Das Foto ist zu groß zum Hochladen. Wähle ein anderes.",
  "no-image":
    "Die KI hat kein Bild zurückgegeben. Starte noch einmal oder nimm ein anderes Foto.",
  "ai-access":
    "Der KI-Zugang fehlt. Aktiviere in Vercel das AI Gateway für dieses Projekt.",
  credits:
    "Das KI-Guthaben ist aufgebraucht. Lade es in Vercel unter AI Gateway auf.",
  busy: "Die KI ist gerade ausgelastet. Starte in einer Minute noch einmal.",
  failed: "Das Verbessern ist fehlgeschlagen. Starte noch einmal.",
  unreadable: "Dieses Foto lässt sich nicht öffnen. Wähle ein JPEG, PNG oder HEIC.",
  offline:
    "Keine Verbindung zum Server. Prüfe dein Internet und lass die App geöffnet, solange sie arbeitet.",
  share: "Das Teilen-Menü ließ sich nicht öffnen. Halte das Bild gedrückt und wähle „Zu Fotos hinzufügen“.",
};

function readPassword() {
  try {
    return localStorage.getItem(PASSWORD_KEY) ?? "";
  } catch {
    return "";
  }
}

function storePassword(value: string) {
  try {
    localStorage.setItem(PASSWORD_KEY, value);
  } catch {
    // Private mode: the password just has to be typed again next time.
  }
}

function megabytes(bytes: number) {
  return (bytes / 1_000_000).toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function Studio() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [mode, setMode] = useState<Mode>("fill");
  const [needsMode, setNeedsMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [askPassword, setAskPassword] = useState(false);

  const source = useRef<HTMLImageElement | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const passwordField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "working") return;
    const started = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (askPassword) passwordField.current?.focus();
  }, [askPassword]);

  async function showPreview(img: HTMLImageElement, nextMode: Mode) {
    const blob = await renderPreview(img, nextMode);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  }

  function clearResult() {
    setResult((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setShowBefore(false);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    let img: HTMLImageElement;
    try {
      img = await loadImage(file);
    } catch {
      setProblem("unreadable");
      return;
    }
    if (source.current) URL.revokeObjectURL(source.current.src);
    source.current = img;
    const portrait = isPortraitFrame(img);
    const nextMode: Mode = portrait ? "fill" : mode;
    setNeedsMode(!portrait);
    setMode(nextMode);
    clearResult();
    await showPreview(img, nextMode);
    setPhase("ready");
  }

  async function changeMode(nextMode: Mode) {
    setMode(nextMode);
    if (source.current) await showPreview(source.current, nextMode);
  }

  async function enhance(password = readPassword()) {
    const img = source.current;
    if (!img) return;
    setProblem(null);
    setSeconds(0);
    setPhase("working");
    try {
      const upload = await prepareUpload(img, mode);
      let response: Response;
      try {
        response = await fetch("/api/enhance", {
          method: "POST",
          headers: {
            "content-type": "image/jpeg",
            "x-aspect-ratio": upload.aspect,
            "x-app-password": encodeURIComponent(password),
          },
          body: upload.blob,
        });
      } catch {
        throw "offline" satisfies Problem;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw (body.error ?? "failed") as Problem;
      }
      const file = await finishImage(await response.blob(), mode);
      clearResult();
      setResult({
        file,
        url: URL.createObjectURL(file),
        shareable: navigator.canShare?.({ files: [file] }) ?? false,
      });
      setPhase("done");
    } catch (error) {
      const code: Problem =
        typeof error === "string" && error in MESSAGES
          ? (error as Problem)
          : "failed";
      setPhase("ready");
      if (code === "password") {
        // An empty password just means it was never entered: ask without scolding.
        setProblem(password ? "password" : null);
        setAskPassword(true);
      } else {
        setProblem(code);
      }
    }
  }

  function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = passwordField.current?.value ?? "";
    if (!value) return;
    storePassword(value);
    setAskPassword(false);
    void enhance(value);
  }

  async function save() {
    if (!result) return;
    if (!result.shareable) {
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.file.name;
      link.click();
      return;
    }
    try {
      await navigator.share({ files: [result.file] });
    } catch (error) {
      if ((error as Error).name !== "AbortError") setProblem("share");
    }
  }

  const working = phase === "working";
  const shownUrl = phase === "done" && !showBefore ? result?.url : previewUrl;

  return (
    <main className="studio">
      <header className="masthead">
        <h1>Hochformat</h1>
        <p>
          Fotos in 4K, {OUTPUT.width} × {OUTPUT.height}
        </p>
      </header>

      <section className="stage" aria-busy={working}>
        <div className="frame">
          <i className="mark tl" />
          <i className="mark tr" />
          <i className="mark bl" />
          <i className="mark br" />

          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob, nothing to optimize
            <img
              className="print"
              src={shownUrl}
              alt={
                phase === "done" && !showBefore
                  ? "Verbessertes Foto"
                  : "Ausgewähltes Foto im Hochformat"
              }
            />
          ) : (
            <button
              type="button"
              className="empty"
              onClick={() => picker.current?.click()}
            >
              <span className="empty-caption">
                <span className="empty-title">Foto wählen</span>
                <span className="empty-note">
                  Es wird geschärft, entrauscht und auf 4K im Format 9:16
                  hochgerechnet.
                </span>
              </span>
            </button>
          )}

          {working && (
            <div className="scan" role="status">
              <span className="lamp" />
              <span className="scan-text">
                Wird verbessert
                <span className="scan-clock">{clock(seconds)}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="desk">
        {problem && (
          <p className="problem" role="alert">
            {MESSAGES[problem]}
          </p>
        )}

        {phase === "ready" && needsMode && (
          <fieldset className="modes">
            <legend>So kommt das Foto ins Hochformat</legend>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "fill"}
                onChange={() => void changeMode("fill")}
              />
              <span>
                Füllen
                <small>Ränder werden abgeschnitten</small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "fit"}
                onChange={() => void changeMode("fit")}
              />
              <span>
                Einpassen
                <small>Ganzes Foto, weicher Rand</small>
              </span>
            </label>
          </fieldset>
        )}

        {working && (
          <p className="note">
            Das dauert meist ein bis zwei Minuten. Lass die App so lange
            geöffnet.
          </p>
        )}

        {phase === "done" && result && (
          <p className="facts">
            {OUTPUT.width} × {OUTPUT.height} Pixel, PNG,{" "}
            {megabytes(result.file.size)} MB
            {result.shareable && (
              <small>Im Teilen-Menü „Bild sichern“ wählen.</small>
            )}
          </p>
        )}

        <div className="actions">
          {phase === "ready" && (
            <>
              <button type="button" className="primary" onClick={() => void enhance()}>
                Verbessern
              </button>
              <button
                type="button"
                className="quiet"
                onClick={() => picker.current?.click()}
              >
                Anderes Foto
              </button>
            </>
          )}
          {phase === "done" && (
            <>
              <button type="button" className="primary" onClick={() => void save()}>
                {result?.shareable ? "In Fotos sichern" : "Herunterladen"}
              </button>
              <div className="pair">
                <button
                  type="button"
                  className="quiet"
                  aria-pressed={showBefore}
                  onClick={() => setShowBefore((v) => !v)}
                >
                  {showBefore ? "Nachher zeigen" : "Vorher zeigen"}
                </button>
                <button
                  type="button"
                  className="quiet"
                  onClick={() => picker.current?.click()}
                >
                  Neues Foto
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <input
        ref={picker}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void pickPhoto(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {askPassword && (
        <div className="veil">
          <form className="sheet" onSubmit={submitPassword}>
            <label htmlFor="password">Passwort</label>
            <p>
              Jedes Bild kostet KI-Guthaben. Darum läuft die App nur mit dem
              Passwort, das in Vercel hinterlegt ist.
            </p>
            <input
              id="password"
              ref={passwordField}
              type="password"
              autoComplete="current-password"
              required
            />
            <div className="pair">
              <button
                type="button"
                className="quiet"
                onClick={() => setAskPassword(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="primary">
                Verbessern
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
