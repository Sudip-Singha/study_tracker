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
const PERSIST_EVERY_N_TICKS = 10;

type TimerStatus = "idle" | "running" | "paused";

interface PersistedState {
  status: TimerStatus;
  elapsedSeconds: number;
  startedAt: string | null;
  isPomodoro: boolean;
  lastTick: string;
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
    // localStorage unavailable (private browsing, etc.) — timer still works,
    // it just won't survive a refresh.
  }
}

export function StudyTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPomodoro, setIsPomodoro] = useState(false);
  const startedAtRef = useRef<string | null>(null);
  const tickCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recover an in-progress session after a refresh.
  useEffect(() => {
    const saved = loadPersisted();
    if (!saved || saved.status === "idle") return;

    startedAtRef.current = saved.startedAt;
    setIsPomodoro(saved.isPomodoro);

    if (saved.status === "running") {
      const secondsSinceLastTick = Math.floor((Date.now() - new Date(saved.lastTick).getTime()) / 1000);
      setElapsedSeconds(saved.elapsedSeconds + Math.max(0, secondsSinceLastTick));
      setStatus("running");
    } else {
      setElapsedSeconds(saved.elapsedSeconds);
      setStatus("paused");
    }
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishSession = useCallback(
    async (finalSeconds: number, pomodoroCompleted: boolean) => {
      stopInterval();
      const startedAt = startedAtRef.current;
      window.localStorage.removeItem(STORAGE_KEY);
      setStatus("idle");
      setElapsedSeconds(0);
      startedAtRef.current = null;

      if (!startedAt || finalSeconds <= 0) return;

      try {
        await logSessionAction({
          started_at: startedAt,
          ended_at: new Date().toISOString(),
          duration_seconds: finalSeconds,
          is_pomodoro: pomodoroCompleted,
        });
        toast.success(pomodoroCompleted ? "Pomodoro complete — session logged" : "Session logged");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save session");
      }
    },
    [stopInterval]
  );

  // The running interval — ticks every second, persists every ~10s.
  useEffect(() => {
    if (status !== "running") return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        tickCountRef.current += 1;

        if (tickCountRef.current % PERSIST_EVERY_N_TICKS === 0) {
          persist({
            status: "running",
            elapsedSeconds: next,
            startedAt: startedAtRef.current,
            isPomodoro,
            lastTick: new Date().toISOString(),
          });
        }

        if (isPomodoro && next >= POMODORO_SECONDS) {
          finishSession(next, true);
        }

        return next;
      });
    }, 1000);

    return stopInterval;
  }, [status, isPomodoro, finishSession, stopInterval]);

  function handleStart() {
    startedAtRef.current = new Date().toISOString();
    tickCountRef.current = 0;
    setElapsedSeconds(0);
    setStatus("running");
    persist({
      status: "running",
      elapsedSeconds: 0,
      startedAt: startedAtRef.current,
      isPomodoro,
      lastTick: new Date().toISOString(),
    });
  }

  function handlePause() {
    setStatus("paused");
    persist({
      status: "paused",
      elapsedSeconds,
      startedAt: startedAtRef.current,
      isPomodoro,
      lastTick: new Date().toISOString(),
    });
  }

  function handleResume() {
    setStatus("running");
    persist({
      status: "running",
      elapsedSeconds,
      startedAt: startedAtRef.current,
      isPomodoro,
      lastTick: new Date().toISOString(),
    });
  }

  function handleStop() {
    finishSession(elapsedSeconds, false);
  }

  const targetSeconds = isPomodoro ? POMODORO_SECONDS : null;
  const displaySeconds = targetSeconds ? Math.max(0, targetSeconds - elapsedSeconds) : elapsedSeconds;

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col items-center gap-6 pt-8">
        <button
          type="button"
          onClick={() => status === "idle" && setIsPomodoro((v) => !v)}
          disabled={status !== "idle"}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
        >
          <TimerReset className="h-3.5 w-3.5" />
          {isPomodoro ? "Pomodoro mode (25m) — tap to switch to open timer" : "Open timer — tap for 25m Pomodoro"}
        </button>

        <div className="stat-number text-6xl tabular-nums">{formatDuration(displaySeconds)}</div>

        <div className="flex gap-3">
          {status === "idle" && (
            <Button size="lg" onClick={handleStart}>
              <Play className="h-4 w-4" /> Start
            </Button>
          )}
          {status === "running" && (
            <>
              <Button size="lg" variant="secondary" onClick={handlePause}>
                <Pause className="h-4 w-4" /> Pause
              </Button>
              <Button size="lg" variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button size="lg" onClick={handleResume}>
                <Play className="h-4 w-4" /> Resume
              </Button>
              <Button size="lg" variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Progress is saved locally every ~10s, so a refresh won't lose your session. Linking a
          session to a specific topic ships once Topic CRUD (build spec M3) is in place.
        </p>
      </CardContent>
    </Card>
  );
}
