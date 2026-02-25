import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_AGENTS, MOCK_CHAT, LLM_MODELS, type ChatMessage } from "@/data/mockData";
import { Send, Copy, RefreshCw, Paperclip, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const MOCK_RESPONSES = [
  "ได้เลยค่ะ! ขอตรวจสอบข้อมูลให้สักครู่นะคะ... 🔍\n\nจากที่ตรวจสอบพบว่า สินค้ารุ่นนี้ยังอยู่ในสต็อกค่ะ สามารถสั่งซื้อได้เลยผ่านเว็บไซต์ หรือจะให้ส่งลิงก์ไปให้ก็ได้นะคะ 😊",
  "สวัสดีค่ะ! ขอบคุณที่สนใจสินค้าของเรานะคะ 🙏\n\nสำหรับคำถามนี้ ขอแนะนำดังนี้:\n1. **ตรวจสอบคู่มือ** หน้า 15-20\n2. **ติดต่อทีมเทคนิค** ผ่านอีเมล\n3. **นัดช่าง** ผ่านระบบออนไลน์\n\nต้องการความช่วยเหลือเพิ่มเติมไหมคะ?",
];

export default function ChatConsole() {
  const agent = MOCK_AGENTS[0];
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState(agent.name);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const resp = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: resp, timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-72 border-r border-border p-4 space-y-4 hidden md:block overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">{agent.avatar}</div>
          <div>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="rounded-lg h-8 text-sm font-semibold border-0 p-0 focus-visible:ring-0" />
            <p className="text-xs text-muted-foreground">{agent.model}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t("chat.tone")}</Label>
            <Select defaultValue="friendly">
              <SelectTrigger className="rounded-xl mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="polite">{t("builder.tonePolite")}</SelectItem>
                <SelectItem value="friendly">{t("builder.toneFriendly")}</SelectItem>
                <SelectItem value="professional">{t("builder.toneProfessional")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("chat.model")}</Label>
            <Select defaultValue="GPT-4o">
              <SelectTrigger className="rounded-xl mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LLM_MODELS.flatMap((p) => p.models).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.role === "user" ? "order-1" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium">{agentName}</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success(t("chat.copied")); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="bg-secondary rounded-2xl px-4 py-3 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Button variant="outline" size="icon" className="rounded-xl shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder={t("chat.typePlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="rounded-xl"
            />
            <Button className="gradient-primary text-primary-foreground rounded-xl shrink-0" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
