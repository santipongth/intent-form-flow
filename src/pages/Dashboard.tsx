import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_AGENTS, MOCK_ACTIVITY } from "@/data/mockData";
import { Plus, Bot, MessageCircle, Zap, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const stats = [
  { label: "Agents ทั้งหมด", value: "4", icon: Bot, color: "text-primary", bg: "bg-secondary" },
  { label: "ข้อความวันนี้", value: "1,893", icon: MessageCircle, color: "text-brand-green", bg: "bg-brand-green/10" },
  { label: "Tokens ใช้ไป", value: "677K", icon: Zap, color: "text-brand-orange", bg: "bg-brand-orange/10" },
];

const activityIcons: Record<string, string> = {
  created: "🆕",
  edited: "✏️",
  message: "💬",
  published: "🚀",
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">ศูนย์บัญชาการ AI Agents ของคุณ</p>
        </div>
        <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => navigate("/agents/new")}>
          <Plus className="h-4 w-4" />
          สร้าง Agent ใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold font-display">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-semibold text-lg">🤖 Agents ของคุณ</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {MOCK_AGENTS.map((agent, i) => (
              <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <Card className="rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                          {agent.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground">{agent.objective}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate("/chat")}>
                            <MessageCircle className="h-4 w-4 mr-2" /> Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" /> แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span>{agent.model}</span>
                      <span>·</span>
                      <span>{agent.messagesCount.toLocaleString()} msgs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
                        {agent.status === "published" ? "🟢 Published" : "📝 Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{agent.createdAt}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg">📋 กิจกรรมล่าสุด</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              {MOCK_ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-lg mt-0.5">{activityIcons[a.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{a.agentName}</span>{" "}
                      <span className="text-muted-foreground">{a.description}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
