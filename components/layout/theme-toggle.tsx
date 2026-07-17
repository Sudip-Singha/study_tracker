"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setThemeAction } from "@/app/actions/theme";

export function ThemeToggle({ theme }: { theme: "light" | "dark" }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    startTransition(async () => {
      await setThemeAction(next);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} disabled={isPending} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
