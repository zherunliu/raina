import { useState, type FormEvent } from "react";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { loginApi, registerApi } from "@/api";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthPage({ register = false }: { register?: boolean }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const search = useSearch({ strict: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    if (register && password !== form.get("confirm")) {
      setError(t("auth.password_mismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (register) await registerApi(username, password);
      else await loginApi(username, password);
      toast.success(
        t(register ? "auth.register_success" : "auth.login_success"),
      );
      await router.invalidate();
      await router.navigate({ to: search.redirect || "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.network_error"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="grid min-h-svh place-items-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <Sparkles className="text-primary" /> Raina
          </Link>
          <Button
            variant="ghost"
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          >
            {locale === "zh" ? "English" : "中文"}
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-semibold">
            {t(register ? "auth.register" : "auth.login")}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {t(register ? "auth.register_desc" : "auth.login_desc")}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block space-y-2 text-sm">
            <span>{t(register ? "auth.email" : "auth.username")}</span>
            <Input
              name="username"
              type={register ? "email" : "text"}
              autoComplete={register ? "email" : "username"}
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>{t("auth.password")}</span>
            <Input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
            />
          </label>
          {register && (
            <label className="block space-y-2 text-sm">
              <span>{t("auth.confirm_password")}</span>
              <Input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {t(
              loading
                ? register
                  ? "auth.signing_up"
                  : "auth.signing_in"
                : register
                  ? "auth.register"
                  : "auth.login",
            )}
          </Button>
        </form>
        <p className="text-muted-foreground text-sm">
          {t(register ? "auth.has_account" : "auth.no_account")}{" "}
          <Link
            to={register ? "/login" : "/register"}
            search={{ redirect: search.redirect || "/" }}
            className="text-primary underline underline-offset-4"
          >
            {t(register ? "auth.go_login" : "auth.go_register")}
          </Link>
        </p>
      </div>
    </main>
  );
}
