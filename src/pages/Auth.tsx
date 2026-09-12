import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { motion } from "framer-motion";
import tmLogo from "@/assets/tm-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("auth.signInError"), { description: error.message });
    } else {
      toast.success(t("auth.signInSuccess"));
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setLoading(false);
    if (error) {
      toast.error(t("auth.signUpError"), { description: error.message });
    } else {
      toast.success(t("auth.signUpSuccess"), { description: t("auth.signUpSuccessDesc") });
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <img src={tmLogo} alt="ThoughtMind" className="w-24 h-24 rounded-2xl object-contain mx-auto mb-5 shadow-lg" />
          <h1 className="font-display text-3xl font-bold">
            {t("auth.title")}
            <span className="sr-only"> — Sign in to manage your AI agents</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">{t("auth.subtitle")}</p>
        </div>

        <Card className="rounded-2xl glass-card">
          <CardContent className="p-6">
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label>{t("auth.email")}</Label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl mt-1" required />
                  </div>
                  <div>
                    <Label>{t("auth.password")}</Label>
                    <Input type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl mt-1" required />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-xl" disabled={loading}>
                    {loading ? t("auth.signingIn") : t("auth.signIn")}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-primary hover:underline mt-1"
                    onClick={async () => {
                      if (!email) {
                        toast.error(t("auth.enterEmailFirst"));
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) {
                        toast.error(t("auth.resetEmailError"), { description: error.message });
                      } else {
                        toast.success(t("auth.resetEmailSent"), { description: t("auth.resetEmailSentDesc") });
                      }
                    }}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label>{t("auth.email")}</Label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl mt-1" required />
                  </div>
                  <div>
                    <Label>{t("auth.password")}</Label>
                    <Input type="password" placeholder={t("auth.passwordMinLength")} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl mt-1" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-xl" disabled={loading}>
                    {loading ? t("auth.signingUp") : t("auth.signUpButton")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
