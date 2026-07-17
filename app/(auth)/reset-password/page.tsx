"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(resetPasswordAction, null);

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-display text-xl font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a password with at least 8 characters.</p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
        </div>
        {state?.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
