"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/app/actions";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="mx-auto mt-6 max-w-sm">
      <div className="mb-6 text-center">
        <div className="mb-2 text-3xl text-accent">◆</div>
        <h1 className="text-2xl font-bold text-cream">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-cream/60">
          {mode === "login"
            ? "Log in to your reading diary."
            : "Start your social reading diary."}
        </p>
      </div>

      <form action={formAction} className="card flex flex-col gap-3 p-5">
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="displayName">
              Display name
            </label>
            <input id="displayName" name="displayName" required className="input" placeholder="Maya Rao" />
          </div>
        )}

        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="input"
            placeholder="maya"
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-cream/45">3–20 chars: lowercase letters, numbers, _</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="input"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-1" disabled={pending}>
          {pending ? "…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-cream/60">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>

      {mode === "login" && (
        <div className="mt-6 rounded-lg border border-ink-line bg-ink-soft/50 p-3 text-center text-xs text-cream/55">
          Try a demo account — username <strong className="text-cream/80">maya</strong>,{" "}
          <strong className="text-cream/80">arjunreads</strong>, or{" "}
          <strong className="text-cream/80">lina</strong> · password{" "}
          <strong className="text-cream/80">booklog123</strong>
        </div>
      )}
    </div>
  );
}
