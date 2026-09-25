import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login — KWAK AUTO SPARE" },
      {
        name: "description",
        content: "Secure administrator sign-in for KWAK AUTO SPARE.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login — KWAK AUTO SPARE" },
      {
        property: "og:description",
        content: "Secure administrator access.",
      },
    ],
  }),

  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Missing details", {
        description: "Enter your email and password.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error || !data.user) {
        toast.error("Sign in failed", {
          description:
            error?.message ?? "Unable to sign in.",
        });

        return;
      }

      // 2. Verify that the authenticated user has ADMIN role
      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin" as never);

      if (adminError || !isAdmin) {
        await supabase.auth.signOut();

        toast.error("Access denied", {
          description:
            "This account does not have administrator access.",
        });

        return;
      }

      // 3. Admin verified
      toast.success("Welcome back", {
        description: "Administrator access verified.",
      });

      await navigate({
        to: "/admin",
        replace: true,
      });
    } catch (error) {
      console.error("Admin login error:", error);

      toast.error("Something went wrong", {
        description:
          "Unable to complete the sign-in. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center">
          <Logo />
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-card mt-6 space-y-4 p-6"
        >
          <div>
            <h1 className="font-display text-xl font-bold">
              Administrator sign in
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Secure access to the KWAK AUTO SPARE manager portal.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading ? "Verifying…" : "Sign in"}
          </Button>

          <div className="flex items-center justify-between text-xs">
            <Link
              to="/"
              className="text-muted-foreground hover:underline"
            >
              Back to shop
            </Link>

            <Link
              to="/auth/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}