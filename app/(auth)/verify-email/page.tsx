import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <MailCheck className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to your email. Click it to activate your account, then log in.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link href="/login">Back to login</Link>
      </Button>
    </div>
  );
}
