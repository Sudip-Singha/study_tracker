"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, Square, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { logSessionAction } from "@/app/(dashboard)/timer/actions";

const STORAGE_KEY = "study-timer-state";
const POMODORO_SECONDS = 25 * 60;

type TimerStatus = "idle" | "running" | "paused";

interface PersistedState {
  status: TimerStatus;
  /** Wall-clock ms at which the running timer logically started (accounting for pauses). */
  runStartMs: number | null;
  /** Seconds already accumulated before the current run segment (for pause/resume). */
  accumulatedSeconds: number;
  startedAt: string | null;
  isPomodoro: boolean;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function persist(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — timer still works, just won't survive a refresh.
  }
}

export function StudyTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  // displaySeconds is derived from wall-clock refs on every RAF tick — no counter drift.
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isPomodoro, setIsPomodoro] = useState(false);

  // Refs that hold the source of truth for time — never stale inside RAF.
  const runStartMsRef = useRef<number | null>(null);   // Date.now() when this run segment began
  const accumulatedRef = useRef(0);                    // seconds banked before current run segment
  const startedAtRef = useRef<string | null>(null);    // ISO string for session DB record
  const rafRef = useRef<number | null>(null);

  // ─── Wall-clock tick (RAF) ────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (runStartMsRef.current === null) return;

    const elapsed = accumulatedRef.current + (Date.now() - runStartMsRef.current) / 1000;
    const seconds = Math.floor(elapsed);

    setDisplaySeconds(seconds);

    // Persist every ~10 s (cheap — just a ref compare).
    if (seconds % 10 === 0 && seconds > 0) {
      persist({
        status: "running",
        runStartMs: runStartMsRef.current,
        accumulatedSeconds: accumulatedRef.current,
        startedAt: startedAtRef.current,
        isPomodoro,
      });
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [isPomodoro]);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ─── Pomodoro completion ──────────────────────────────────────────────────
  // Watch displaySeconds to auto-finish Pomodoro.
  useEffect(() => {
    if (isPomodoro && status === "running" && displaySeconds >= POMODORO_SECONDS) {
      handleFinish(displaySeconds, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySeconds, isPomodoro, status]);

  // ─── Restore persisted state on mount ────────────────────────────────────
  useEffect(() => {
    const saved = loadPersisted();
    if (!saved || saved.status === "idle") return;

    startedAtRef.current = saved.startedAt;
    setIsPomodoro(saved.isPomodoro);

    if (saved.status === "running" && saved.runStartMs !== null) {
      // Restore as if timer never stopped — wall-clock diff makes it accurate.
      runStartMsRef.current = saved.runStartMs;
      accumulatedRef.current = saved.accumulatedSeconds;
      setStatus("running");
    } else if (saved.status === "paused") {
      accumulatedRef.current = saved.accumulatedSeconds;
      setDisplaySeconds(Math.floor(saved.accumulatedSeconds));
      setStatus("paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop RAF loop based on status.
  useEffect(() => {
    if (status === "running") {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      stopRaf();
    }
    return stopRaf;
  }, [status, tick, stopRaf]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleStart() {
    const now = Date.now();
    startedAtRef.current = new Date(now).toISOString();
    runStartMsRef.current = now;
    accumulatedRef.current = 0;
    setDisplaySeconds(0);
    setStatus("running");
    persist({
      status: "running",
      runStartMs: now,
      accumulatedSeconds: 0,
      startedAt: startedAtRef.current,
      isPomodoro,
    });
  }

  function handlePause() {
    if (runStartMsRef.current !== null) {
      accumulatedRef.current += (Date.now() - runStartMsRef.current) / 1000;
      runStartMsRef.current = null;
    }
    setStatus("paused");
    persist({
      status: "paused",
      runStartMs: null,
      accumulatedSeconds: accumulatedRef.current,
      startedAt: startedAtRef.current,
      isPomodoro,
    });
  }

  function handleResume() {
    runStartMsRef.current = Date.now();
    setStatus("running");
    persist({
      status: "running",
      runStartMs: runStartMsRef.current,
      accumulatedSeconds: accumulatedRef.current,
      startedAt: startedAtRef.current,
      isPomodoro,
    });
  }

  async function handleFinish(finalSeconds: number, pomodoroCompleted: boolean) {
    stopRaf();
    const startedAt = startedAtRef.current;
    window.localStorage.removeItem(STORAGE_KEY);
    runStartMsRef.current = null;
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setStatus("idle");
    setDisplaySeconds(0);

    if (!startedAt || finalSeconds <= 0) return;

    try {
      await logSessionAction({
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        duration_seconds: Math.round(finalSeconds),
        is_pomodoro: pomodoroCompleted,
      });
      toast.success(pomodoroCompleted ? "Pomodoro complete — session logged!" : "Session logged!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save session");
    }
  }

  function handleStop() {
    // Finalise accumulated time
    let finalSeconds = accumulatedRef.current;
    if (status === "running" && runStartMsRef.current !== null) {
      finalSeconds += (Date.now() - runStartMsRef.current) / 1000;
    }
    handleFinish(finalSeconds, false);
  }

  const timerDisplay = isPomodoro
    ? Math.max(0, POMODORO_SECONDS - displaySeconds)
    : displaySeconds;

  // Progress for Pomodoro ring
  const pomodoroProgress = isPomodoro
    ? Math.min(1, displaySeconds / POMODORO_SECONDS)
    : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pomodoroProgress);

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-8 py-10 px-8">
        {/* Mode Toggle */}
        <button
          type="button"
          onClick={() => status === "idle" && setIsPomodoro((v) => !v)}
          disabled={status !== "idle"}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TimerReset className="h-4 w-4" />
          {isPomodoro ? "Pomodoro (25 min) — tap to switch" : "Open Timer — tap for Pomodoro"}
        </button>

        {/* Timer Display */}
        <div className="relative flex items-center justify-center">
          {isPomodoro && (
            <svg
              className="absolute"
              width={260}
              height={260}
              viewBox="0 0 260 260"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background ring */}
              <circle
                cx={130}
                cy={130}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={8}
              />
              {/* Progress ring */}
              <circle
                cx={130}
                cy={130}
                r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </svg>
          )}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="stat-number font-mono text-8xl font-bold tabular-nums tracking-tight">
              {formatDuration(timerDisplay)}
            </span>
            {status !== "idle" && (
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          {status === "idle" && (
            <Button size="lg" className="px-10 text-base" onClick={handleStart}>
              <Play className="h-5 w-5" /> Start
            </Button>
          )}
          {status === "running" && (
            <>
              <Button size="lg" variant="secondary" className="px-8 text-base" onClick={handlePause}>
                <Pause className="h-5 w-5" /> Pause
              </Button>
              <Button size="lg" variant="destructive" className="px-8 text-base" onClick={handleStop}>
                <Square className="h-5 w-5" /> Stop
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button size="lg" className="px-8 text-base" onClick={handleResume}>
                <Play className="h-5 w-5" /> Resume
              </Button>
              <Button size="lg" variant="destructive" className="px-8 text-base" onClick={handleStop}>
                <Square className="h-5 w-5" /> Stop
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Timer uses wall-clock time — stays accurate across tabs and background. Session auto-saved every ~10s.
        </p>
      </CardContent>
    </Card>
  );
}
