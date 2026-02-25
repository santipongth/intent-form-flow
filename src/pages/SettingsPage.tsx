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

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [darkMode, setDarkMode] = useState(false);

  const toggleKey = (id: string) => setShowKeys((p) => ({ ...p, [id]: !p[id] }));

  const handleSave = () => toast.success("บันทึกเรียบร้อย! ✅");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">⚙️ Settings</h1>
        <p className="text-muted-foreground text-sm">จัดการบัญชีและ API Keys</p>
      </div>

      <Tabs defaultValue="apikeys">
        <TabsList className="rounded-xl">
          <TabsTrigger value="apikeys" className="rounded-lg">🔑 API Keys</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg">👤 Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg">🎨 Preferences</TabsTrigger>
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
            <Save className="h-4 w-4" /> บันทึก API Keys
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
                <Label>ชื่อ</Label>
                <Input defaultValue="ThoughtMind User" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue="user@thoughtmind.app" className="rounded-xl mt-1" />
              </div>
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" /> บันทึก
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">🌙 Dark Mode</p>
                  <p className="text-sm text-muted-foreground">เปลี่ยนเป็นธีมมืด</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={(v) => { setDarkMode(v); document.documentElement.classList.toggle("dark", v); }} />
              </div>
              <div>
                <Label>ภาษา</Label>
                <Input defaultValue="ไทย" className="rounded-xl mt-1" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
