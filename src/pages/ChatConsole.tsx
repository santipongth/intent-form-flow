import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Copy, Paperclip, Bot, Plus, MessageSquare, Settings2, PanelLeftOpen, Search, Trash2, ThumbsUp, ThumbsDown, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAgents } from "@/hooks/useAgents";
import { useConversations, useConversationMessages, useCreateConversation, useSaveMessage, useUpdateConversationTitle, useDeleteConversation } from "@/hooks/useConversations";
import { streamChat } from "@/lib/streamChat";
import { verifyAnswer, type GroundingResult } from "@/lib/verifyAnswer";
import { useMessageFeedback, useSaveMessageFeedback } from "@/hooks/useMessageFeedback";
import ReactMarkdown from "react-markdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CitationList, type Citation } from "@/components/agent-detail/CitationList";


interface LocalMessage {
  id: string;
  dbId?: string;
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
  const { data: feedbackMap } = useMessageFeedback(activeConvId);
  const saveFeedback = useSaveMessageFeedback();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [grounding, setGrounding] = useState<Record<string, GroundingResult | "loading">>({});
  const [citations, setCitations] = useState<Record<string, Citation[]>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages from DB when conversation changes
  useEffect(() => {
    if (dbMessages) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          dbId: m.id,
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
    saveMessage.mutate(
      {
        conversation_id: convId,
        role: "user",
        content: userContent,
      },
      {
        onSuccess: (data: any) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === userMsg.id ? { ...m, dbId: data.id } : m))
          );
        },
      }
    );

    // Update conversation title on first message only — never overwrite the
    // title of an existing conversation whose history may still be loading.
    const existingConv = conversations?.find((c: any) => c.id === convId);
    const hasTitle = !!existingConv?.title && existingConv.title !== "New Chat";
    if (messages.length === 0 && !hasTitle) {
      updateTitle.mutate({ id: convId, title: userContent.slice(0, 50) });
    }

    // Stream AI response
    setIsStreaming(true);
    let assistantSoFar = "";
    let pendingCitations: Citation[] = [];
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
        onMeta: (meta) => {
          if (meta.citations?.length) pendingCitations = meta.citations as Citation[];
          if (meta.budgetWarning) toast.warning(meta.budgetWarning);
        },
        onDone: () => {
          const responseTime = Date.now() - startTime;
          setIsStreaming(false);
          // Finalize the streaming message ID
          const finalId = Date.now().toString();
          setMessages((prev) =>
            prev.map((m) => (m.id === "streaming" ? { ...m, id: finalId } : m))
          );
          if (pendingCitations.length) {
            setCitations((c) => ({ ...c, [finalId]: pendingCitations }));
          }


          // Check the answer against the agent's uploaded files (RAG grounding)
          if (assistantSoFar && selectedAgentId) {
            setGrounding((g) => ({ ...g, [finalId]: "loading" }));
            verifyAnswer({
              agentId: selectedAgentId,
              question: userContent,
              answer: assistantSoFar,
              conversationId: convId,
            })
              .then((res) => setGrounding((g) => ({ ...g, [finalId]: res })))
              .catch(() => setGrounding((g) => {
                const next = { ...g }; delete next[finalId]; return next;
              }));
          }
          // Save assistant message to DB
          if (assistantSoFar && convId) {
            saveMessage.mutate(
              {
                conversation_id: convId,
                role: "assistant",
                content: assistantSoFar,
                response_time_ms: responseTime,
              },
              {
                onSuccess: (data: any) => {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id !== "streaming" && m.role === "assistant" && !m.dbId && m.content === assistantSoFar
                        ? { ...m, dbId: data.id }
                        : m
                    )
                  );
                },
              }
            );
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
      {/* Desktop Sidebar */}
      <div className="w-64 border-r border-border flex-col hidden md:flex">
        <SidebarContent
          agents={agents}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          conversations={conversations}
          activeConvId={activeConvId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile sidebar toggle */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 md:hidden shrink-0">
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full pt-8">
                  <SidebarContent
                    agents={agents}
                    selectedAgentId={selectedAgentId}
                    setSelectedAgentId={setSelectedAgentId}
                    conversations={conversations}
                    activeConvId={activeConvId}
                    onNewChat={() => { handleNewChat(); setMobileSidebarOpen(false); }}
                    onSelectConversation={(id) => { handleSelectConversation(id); setMobileSidebarOpen(false); }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {selectedAgent && (
              <>
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm shrink-0">
                  {selectedAgent.avatar}
                </div>
                <span className="text-sm font-medium truncate">{selectedAgent.name}</span>
              </>
            )}
            {!selectedAgent && <span className="text-sm text-muted-foreground truncate">Select an agent to start</span>}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 shrink-0">
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center space-y-3 px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl mx-auto">
                  <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">
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
              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "order-1" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg gradient-primary flex items-center justify-center">
                      <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium">{selectedAgent?.name || "AI"}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm ${
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
                {msg.role === "assistant" && <CitationList citations={citations[msg.id] || []} />}
                {msg.role === "assistant" && <GroundingNote state={grounding[msg.id]} t={t} />}

                <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{msg.timestamp}</span>
                  {msg.role === "assistant" && msg.id !== "streaming" && msg.dbId && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${feedbackMap?.[msg.dbId] === "up" ? "text-green-500" : ""}`}
                        onClick={() =>
                          saveFeedback.mutate({
                            messageId: msg.dbId!,
                            rating: "up",
                            currentRating: feedbackMap?.[msg.dbId!],
                          })
                        }
                      >
                        <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${feedbackMap?.[msg.dbId] === "down" ? "text-red-500" : ""}`}
                        onClick={() =>
                          saveFeedback.mutate({
                            messageId: msg.dbId!,
                            rating: "down",
                            currentRating: feedbackMap?.[msg.dbId!],
                          })
                        }
                      >
                        <ThumbsDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    </>
                  )}
                  {msg.role === "assistant" && msg.id !== "streaming" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        toast.success(t("chat.copied"));
                      }}
                    >
                      <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
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
        <div className="border-t border-border p-2.5 sm:p-4">
          <div className="flex gap-1.5 sm:gap-2 max-w-3xl mx-auto">
            <Button variant="outline" size="icon" className="rounded-xl shrink-0 h-9 w-9 sm:h-10 sm:w-10">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder={t("chat.typePlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="rounded-xl h-9 sm:h-10 text-sm"
              disabled={isStreaming}
            />
            <Button
              className="gradient-primary text-primary-foreground rounded-xl shrink-0 h-9 w-9 sm:h-10 sm:w-10"
              size="icon"
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

/* Extracted sidebar content for reuse in desktop & mobile sheet */
function SidebarContent({
  agents,
  selectedAgentId,
  setSelectedAgentId,
  conversations,
  activeConvId,
  onNewChat,
  onSelectConversation,
}: {
  agents: any[] | undefined;
  selectedAgentId: string;
  setSelectedAgentId: (v: string) => void;
  conversations: any[] | undefined;
  activeConvId: string | undefined;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const deleteConversation = useDeleteConversation();
  const navigate = useNavigate();

  const filteredConversations = conversations?.filter(conv =>
    !searchQuery || (conv.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    deleteConversation.mutate(convId, {
      onSuccess: () => {
        if (activeConvId === convId) {
          navigate("/chat", { replace: true });
        }
        toast.success("Conversation deleted");
      },
    });
  };

  return (
    <>
      <div className="p-3 border-b border-border space-y-2">
        <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2" size="sm" onClick={onNewChat}>
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
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl h-8 text-xs pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations?.map((conv) => (
            <div
              key={conv.id}
              className={`group relative w-full text-left px-3 py-2 rounded-xl text-sm truncate transition-colors cursor-pointer ${
                activeConvId === conv.id
                  ? "bg-secondary font-medium"
                  : "hover:bg-secondary/50 text-muted-foreground"
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{conv.title || "New Chat"}</span>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground ml-5.5 mt-0.5">
                {new Date(conv.updated_at).toLocaleDateString("th-TH")}
              </p>
            </div>
          ))}
          {(!filteredConversations || filteredConversations.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function GroundingNote({
  state,
  t,
}: {
  state: GroundingResult | "loading" | undefined;
  t: (k: string) => string;
}) {
  if (!state) return null;
  if (state === "loading") {
    return (
      <p className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> {t("chat.grounding.checking")}
      </p>
    );
  }
  if (state.status !== "checked" || state.grounded) return null;

  const sources = (state.sources || []).map((s) => s.file_name);
  const uniqueSources = Array.from(new Set(sources)).slice(0, 3);

  return (
    <div className="mt-1.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] space-y-1">
      <p className="flex items-center gap-1.5 font-medium text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        {state.verdict === "contradicted"
          ? t("chat.grounding.contradicted")
          : t("chat.grounding.warning")}
      </p>
      {state.summary && <p className="text-muted-foreground">{state.summary}</p>}
      {state.issues && state.issues.length > 0 && (
        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
          {state.issues.map((issue, i) => <li key={i}>{issue}</li>)}
        </ul>
      )}
      {uniqueSources.length > 0 && (
        <p className="text-muted-foreground">
          {t("chat.grounding.sources")}: {uniqueSources.join(", ")}
        </p>
      )}
    </div>
  );
}
