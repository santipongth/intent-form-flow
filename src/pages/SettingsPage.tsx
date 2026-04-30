import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile.mutate({ display_name: displayName }, {
      onSuccess: () => toast.success(t("settings.saved")),
      onError: () => toast.error("Failed to update profile"),
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg">{t("settings.preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-16 h-16 rounded-2xl object-cover" /> : "👤"}
                </div>
                <div>
                  <h3 className="font-semibold">{profile?.display_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div>
                <Label>{t("settings.name")}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="rounded-xl mt-1" />
              </div>
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t("settings.darkMode")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.darkModeDesc")}</p>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
              <div>
                <Label>{t("settings.language")}</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={locale === "th" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setLocale("th")}>🇹🇭 ไทย</Button>
                  <Button variant={locale === "en" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setLocale("en")}>🇺🇸 English</Button>
                </div>
              </div>
              <div className="border-t pt-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{t("settings.emailConfirm")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("settings.emailConfirmDesc")}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t("settings.emailConfirmHint")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl mt-3 gap-2"
                      onClick={() => window.open("https://supabase.com/dashboard/project/hiyzlaiqeygxvpgveadq/auth/providers", "_blank")}
                    >
                      {t("settings.emailConfirmManage")} <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
