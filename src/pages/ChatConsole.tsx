import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Copy, Paperclip, Bot, Plus, MessageSquare, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAgents } from "@/hooks/useAgents";
import { useConversations, useConversationMessages, useCreateConversation, useSaveMessage, useUpdateConversationTitle } from "@/hooks/useConversations";
import { streamChat } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatConsole() {
  const { conversationId: urlConvId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: agents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [activeConvId, setActiveConvId] = useState<string | undefined>(urlConvId);
  const { data: conversations } = useConversations();
  const { data: dbMessages } = useConversationMessages(activeConvId);
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const updateTitle = useUpdateConversationTitle();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages from DB when conversation changes
  useEffect(() => {
    if (dbMessages) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        }))
      );
    }
  }, [dbMessages]);

  // Sync URL param
  useEffect(() => {
    if (urlConvId && urlConvId !== activeConvId) {
      setActiveConvId(urlConvId);
    }
  }, [urlConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Set default agent
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents]);

  const handleNewChat = async () => {
    const conv = await createConversation.mutateAsync({
      agentId: selectedAgentId || undefined,
      title: "New Chat",
    });
    setActiveConvId(conv.id);
    setMessages([]);
    navigate(`/chat/${conv.id}`, { replace: true });
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    navigate(`/chat/${convId}`, { replace: true });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userContent = input.trim();
    setInput("");

    // Create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      const conv = await createConversation.mutateAsync({
        agentId: selectedAgentId || undefined,
        title: userContent.slice(0, 50),
      });
      convId = conv.id;
      setActiveConvId(conv.id);
      navigate(`/chat/${conv.id}`, { replace: true });
    }

    // Add user message locally
    const userMsg: LocalMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to DB
    saveMessage.mutate({
      conversation_id: convId,
      role: "user",
      content: userContent,
    });

    // Update conversation title on first message
    if (messages.length === 0) {
      updateTitle.mutate({ id: convId, title: userContent.slice(0, 50) });
    }

    // Stream AI response
    setIsStreaming(true);
    let assistantSoFar = "";
    const startTime = Date.now();

    const allMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent },
    ];

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [
          ...prev,
          {
            id: "streaming",
            role: "assistant" as const,
            content: assistantSoFar,
            timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      });
    };

    try {
      await streamChat({
        messages: allMessages,
        agentId: selectedAgentId || undefined,
        conversationId: convId,
        onDelta: upsertAssistant,
        onDone: () => {
          const responseTime = Date.now() - startTime;
          setIsStreaming(false);
          // Finalize the streaming message ID
          setMessages((prev) =>
            prev.map((m) => (m.id === "streaming" ? { ...m, id: Date.now().toString() } : m))
          );
          // Save assistant message to DB
          if (assistantSoFar && convId) {
            saveMessage.mutate({
              conversation_id: convId,
              role: "assistant",
              content: assistantSoFar,
              response_time_ms: responseTime,
            });
          }
        },
        onError: (err) => {
          setIsStreaming(false);
          toast.error(err);
        },
      });
    } catch (e) {
      setIsStreaming(false);
      toast.error("Failed to get response");
    }
  };

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar: Conversations */}
      <div className="w-64 border-r border-border flex flex-col hidden md:flex">
        <div className="p-3 border-b border-border space-y-2">
          <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2" size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4" /> New Chat
          </Button>
          {agents && agents.length > 0 && (
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="rounded-xl h-8 text-xs">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.avatar} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm truncate transition-colors ${
                  activeConvId === conv.id
                    ? "bg-secondary font-medium"
                    : "hover:bg-secondary/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{conv.title || "New Chat"}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-5.5 mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString("th-TH")}
                </p>
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedAgent && (
              <>
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm">
                  {selectedAgent.avatar}
                </div>
                <span className="text-sm font-medium">{selectedAgent.name}</span>
              </>
            )}
            {!selectedAgent && <span className="text-sm text-muted-foreground">Select an agent to start</span>}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 rounded-xl">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Agent</Label>
                  {agents && (
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                      <SelectTrigger className="rounded-xl mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl mx-auto">
                  <Bot className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {selectedAgent ? `Start chatting with ${selectedAgent.name}` : "Select an agent and start chatting"}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] ${msg.role === "user" ? "order-1" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium">{selectedAgent?.name || "AI"}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  {msg.role === "assistant" && msg.id !== "streaming" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        toast.success(t("chat.copied"));
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
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

        {/* Input */}
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
              disabled={isStreaming}
            />
            <Button
              className="gradient-primary text-primary-foreground rounded-xl shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
