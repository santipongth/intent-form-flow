import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, KeyRound, LogOut, Save, Shield, Settings as SettingsIcon, Monitor, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { t, locale } = useLanguage();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const verified = !!user?.email_confirmed_at;
  const initials = (profile?.display_name || user?.email || "U").slice(0, 2).toUpperCase();

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const handleSendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) toast.error(t("auth.resetEmailError"), { description: error.message });
    else toast.success(t("profile.resetSent"), { description: t("auth.resetEmailSentDesc") });
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { display_name: displayName },
      {
        onSuccess: () => toast.success(t("settings.saved")),
        onError: () => toast.error(t("profile.updateError")),
      },
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSignOutOthers = async () => {
    if (!window.confirm(t("profile.signOutOthersConfirm"))) return;
    setSigningOutOthers(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setSigningOutOthers(false);
    if (error) toast.error(t("profile.signOutOthersError"), { description: error.message });
    else toast.success(t("profile.signOutOthersSuccess"));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("profile.subtitle")}</p>
      </div>

      {/* Account card */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 rounded-2xl">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="rounded-2xl gradient-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{profile?.display_name || user?.email?.split("@")[0]}</h3>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-2">
                {verified ? (
                  <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" /> {t("profile.verified")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                    <AlertCircle className="h-3 w-3" /> {t("profile.unverified")}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("profile.memberSince")}</p>
              <p className="font-medium">{fmtDate(user?.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("profile.lastSignIn")}</p>
              <p className="font-medium">{fmtDate(user?.last_sign_in_at)}</p>
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <Label>{t("settings.name")}</Label>
            <div className="flex gap-2">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl" />
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security card */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("profile.security")}</h3>
              <p className="text-sm text-muted-foreground">{t("profile.securityDesc")}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border">
            <div className="flex items-center gap-3 min-w-0">
              <KeyRound className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">{t("profile.changePassword")}</p>
                <p className="text-xs text-muted-foreground truncate">{t("profile.changePasswordDesc")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={handleSendReset} disabled={sendingReset}>
              {t("profile.sendResetLink")}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border">
            <div className="flex items-center gap-3 min-w-0">
              <SettingsIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">{t("settings.title")}</p>
                <p className="text-xs text-muted-foreground truncate">{t("settings.subtitle")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => navigate("/settings")}>
              {t("profile.editProfile")}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-3 min-w-0">
              <LogOut className="h-5 w-5 text-destructive shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">{t("profile.signOutAll")}</p>
                <p className="text-xs text-muted-foreground truncate">{t("profile.signOutAllDesc")}</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl shrink-0" onClick={handleSignOut}>
              {t("sidebar.signOut")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}