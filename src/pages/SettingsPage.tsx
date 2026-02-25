import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LLM_MODELS } from "@/data/mockData";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useApiKeys() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_api_keys", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_api_keys")
        .select("provider, api_key_encrypted");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.provider] = r.api_key_encrypted; });
      return map;
    },
    enabled: !!user,
  });
}

function useSaveApiKeys() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (keys: Record<string, string>) => {
      if (!user) throw new Error("Not authenticated");
      const entries = Object.entries(keys).filter(([, v]) => v.trim());
      for (const [provider, key] of entries) {
        const { error } = await (supabase as any)
          .from("user_api_keys")
          .upsert(
            { user_id: user.id, provider, api_key_encrypted: key, updated_at: new Date().toISOString() },
            { onConflict: "user_id,provider" }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_api_keys"] }),
  });
}

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: savedKeys } = useApiKeys();
  const saveApiKeys = useSaveApiKeys();

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    if (savedKeys) setKeys(prev => ({ ...savedKeys, ...prev }));
  }, [savedKeys]);

  const toggleKey = (id: string) => setShowKeys((p) => ({ ...p, [id]: !p[id] }));

  const handleSaveKeys = () => {
    saveApiKeys.mutate(keys, {
      onSuccess: () => toast.success(t("settings.saved")),
      onError: () => toast.error("Failed to save API keys"),
    });
  };

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

      <Tabs defaultValue="apikeys">
        <TabsList className="rounded-xl">
          <TabsTrigger value="apikeys" className="rounded-lg">{t("settings.apiKeys")}</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg">{t("settings.preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="apikeys" className="space-y-4 mt-4">
          {LLM_MODELS.map((m) => (
            <Card key={m.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <h3 className="font-semibold">{m.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    type={showKeys[m.id] ? "text" : "password"}
                    placeholder={`${m.name} API Key`}
                    value={keys[m.id] || ""}
                    onChange={(e) => setKeys({ ...keys, [m.id]: e.target.value })}
                    className="rounded-xl"
                  />
                  <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => toggleKey(m.id)}>
                    {showKeys[m.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSaveKeys} disabled={saveApiKeys.isPending}>
            <Save className="h-4 w-4" /> {t("settings.saveApiKeys")}
          </Button>
        </TabsContent>

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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
