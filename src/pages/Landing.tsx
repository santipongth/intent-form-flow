import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/data/mockData";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { icon: Sparkles, title: "ไม่ต้องเขียนโค้ด", description: "สร้าง AI Agent ด้วย Wizard ง่ายๆ 5 ขั้นตอน", color: "text-primary" },
  { icon: Zap, title: "เร็วทันใจ", description: "เชื่อมต่อ LLM ชั้นนำ ทั้ง OpenAI, Claude, Gemini", color: "text-brand-orange" },
  { icon: Shield, title: "ปลอดภัย", description: "API Key ของคุณถูกเก็บรักษาอย่างปลอดภัย", color: "text-brand-green" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-xl">🧠</div>
            <span className="font-display font-bold text-xl gradient-text">ThoughtMind</span>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-xl">
            เข้าสู่ Dashboard
          </Button>
        </nav>

        <section className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground mb-6">
              <Sparkles className="h-4 w-4" />
              LangFlow สำหรับคนปกติ
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
              สร้าง <span className="gradient-text">AI Agent</span><br />
              ง่ายเหมือนกรอกฟอร์ม
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              ไม่ต้องลากเส้น ไม่ต้องเขียนโค้ด แค่บอกว่าอยากได้ AI ช่วยเรื่องอะไร
              แล้ว ThoughtMind จะสร้างให้คุณใน 5 นาที
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="gradient-primary text-primary-foreground rounded-xl text-base px-8 gap-2" onClick={() => navigate("/agents/new")}>
                🚀 เริ่มสร้าง Agent ตัวแรก
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl text-base px-8" onClick={() => navigate("/dashboard")}>
                ดู Demo
              </Button>
            </div>
          </motion.div>
        </section>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <f.icon className={`h-10 w-10 mb-4 ${f.color}`} />
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Template Gallery */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold mb-3">เริ่มจาก Template สำเร็จรูป</h2>
          <p className="text-muted-foreground">เลือก Template แล้วปรับแต่งให้ตรงใจ ไม่ต้องเริ่มจากศูนย์</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => navigate("/agents/new")}>
                <CardContent className="p-5">
                  <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${t.color} mb-4`} />
                  <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <span className="inline-block mt-3 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1">{t.category}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
