import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import tmLogo from "@/assets/tm-logo.png";

type Status = "verifying" | "success" | "expired" | "pending";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      const code = params.get("code");
      const errorDesc = params.get("error_description") || new URLSearchParams(hash.replace(/^#/, "")).get("error_description");

      if (errorDesc) {
        if (!cancelled) setStatus("expired");
        return;
      }

      // PKCE-style code exchange
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) setStatus("expired");
          else {
            setStatus("success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
          }
        }
        return;
      }

      // Hash-based confirmation (#access_token=...&type=signup)
      if (hash.includes("access_token") || hash.includes("type=signup") || hash.includes("type=email")) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          if (data.session) {
            setStatus("success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
          } else {
            setStatus("expired");
          }
        }
        return;
      }

      // No callback params — landed here right after sign-up
      if (!cancelled) setStatus("pending");
    };

    verify();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.hash]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setResending(false);
    if (error) {
      toast.error(t("verify.resendError"), { description: error.message });
    } else {
      toast.success(t("verify.resendSuccess"), { description: t("verify.resendSuccessDesc") });
      setStatus("pending");
    }
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
          <h1 className="font-display text-2xl font-bold">{t("verify.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("verify.subtitle")}</p>
        </div>

        <Card className="rounded-2xl glass-card">
          <CardContent className="p-6">
            {status === "verifying" && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">{t("verify.verifying")}</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{t("verify.success")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("verify.successDesc")}</p>
                </div>
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mt-2" />
              </div>
            )}

            {status === "pending" && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t("verify.pending")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("verify.pendingDesc")}</p>
                </div>
                <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                  <div className="text-left">
                    <Label>{t("verify.emailLabel")}</Label>
                    <Input
                      type="email"
                      placeholder={t("verify.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl mt-1"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground" disabled={resending}>
                    {resending ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t("verify.resending")}</span>
                    ) : t("verify.resend")}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => navigate("/auth")}>
                    {t("verify.backToSignIn")}
                  </Button>
                </form>
              </div>
            )}

            {status === "expired" && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">{t("verify.expired")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("verify.expiredDesc")}</p>
                </div>
                <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                  <div className="text-left">
                    <Label>{t("verify.emailLabel")}</Label>
                    <Input
                      type="email"
                      placeholder={t("verify.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl mt-1"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground" disabled={resending}>
                    {resending ? t("verify.resending") : t("verify.resend")}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => navigate("/auth")}>
                    {t("verify.backToSignIn")}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}