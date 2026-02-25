import { useState } from "react";
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

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const toggleKey = (id: string) => setShowKeys((p) => ({ ...p, [id]: !p[id] }));
  const handleSave = () => toast.success(t("settings.saved"));

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
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> {t("settings.saveApiKeys")}
          </Button>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl">👤</div>
                <div>
                  <h3 className="font-semibold">ThoughtMind User</h3>
                  <p className="text-sm text-muted-foreground">user@thoughtmind.app</p>
                </div>
              </div>
              <div>
                <Label>{t("settings.name")}</Label>
                <Input defaultValue="ThoughtMind User" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue="user@thoughtmind.app" className="rounded-xl mt-1" />
              </div>
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSave}>
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
