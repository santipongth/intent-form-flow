import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import tmLogo from "@/assets/tm-logo.png";

type Status = "verifying" | "ready" | "invalid" | "success";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("verifying");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Supabase recovery links arrive in two shapes:
      // 1) Hash fragment: #access_token=...&type=recovery
      // 2) Query param:   ?code=...  (PKCE flow)
      const hash = window.location.hash || "";
      const search = window.location.search || "";

      // PKCE-style code exchange
      const codeMatch = new URLSearchParams(search).get("code");
      if (codeMatch) {
        const { error } = await supabase.auth.exchangeCodeForSession(codeMatch);
        if (!cancelled) setStatus(error ? "invalid" : "ready");
        return;
      }

      // Hash-based recovery
      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        // Wait briefly for Supabase client to process the hash
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setStatus(data.session ? "ready" : "invalid");
        return;
      }

      // Maybe the user already has a recovery session active
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setStatus(data.session ? "ready" : "invalid");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    verify();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Simple password strength: length + variety
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 3);
  }, [password]);

  const strengthLabel = strength <= 1 ? t("reset.strengthWeak") : strength === 2 ? t("reset.strengthFair") : t("reset.strengthStrong");
  const strengthColor = strength <= 1 ? "bg-destructive" : strength === 2 ? "bg-yellow-500" : "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("reset.tooShort")); return; }
    if (password !== confirmPassword) { toast.error(t("reset.mismatch")); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(t("reset.error"), { description: error.message });
      return;
    }
    setStatus("success");
    toast.success(t("reset.success"));
    setTimeout(() => navigate("/profile", { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src={tmLogo} alt="ThoughtMind" className="w-20 h-20 rounded-2xl object-contain mx-auto mb-4 shadow-lg" />
          <h1 className="font-display text-2xl font-bold">{t("reset.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("reset.subtitle")}</p>
        </div>

        <Card className="rounded-2xl glass-card">
          <CardContent className="p-6">
            {status === "verifying" && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">{t("reset.verifying")}</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">{t("reset.invalidLink")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("reset.invalidLinkDesc")}</p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => navigate("/auth")}>
                    {t("reset.requestNew")}
                  </Button>
                  <Button variant="ghost" className="rounded-xl" onClick={() => navigate("/auth")}>
                    {t("reset.backToSignIn")}
                  </Button>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{t("reset.success")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("reset.successDesc")}</p>
                </div>
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mt-2" />
              </div>
            )}

            {status === "ready" && (
              <>
                <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{t("reset.verified")}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>{t("reset.newPassword")}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPwd ? "text" : "password"}
                        placeholder={t("auth.passwordMinLength")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-xl pr-20"
                        required
                        minLength={6}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                        onClick={() => setShowPwd((s) => !s)}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPwd ? t("reset.hide") : t("reset.show")}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(strength / 3) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">{strengthLabel}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>{t("reset.confirmPassword")}</Label>
                    <Input
                      type={showPwd ? "text" : "password"}
                      placeholder={t("reset.confirmPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl mt-1"
                      required
                      minLength={6}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive mt-1">{t("reset.mismatch")}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground rounded-xl"
                    disabled={loading || password.length < 6 || password !== confirmPassword}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t("reset.saving")}
                      </span>
                    ) : (
                      t("reset.submit")
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
