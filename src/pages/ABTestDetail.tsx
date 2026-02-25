import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Bot, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useABTest } from "@/hooks/useABTesting";
import { useAgents } from "@/hooks/useAgents";
import { streamChat } from "@/lib/streamChat";
import ReactMarkdown from "react-markdown";

interface SideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ABTestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: test } = useABTest(id);
  const { data: agents } = useAgents();

  const [input, setInput] = useState("");
  const [messagesA, setMessagesA] = useState<SideMessage[]>([]);
  const [messagesB, setMessagesB] = useState<SideMessage[]>([]);
  const [streamingA, setStreamingA] = useState(false);
  const [streamingB, setStreamingB] = useState(false);
  const [votes, setVotes] = useState<{ a: number; b: number; tie: number }>({ a: 0, b: 0, tie: 0 });

  const endRefA = useRef<HTMLDivElement>(null);
  const endRefB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRefA.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesA, streamingA]);

  useEffect(() => {
    endRefB.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesB, streamingB]);

  const agentA = agents?.find((a) => a.id === test?.agent_a_id);
  const agentB = agents?.find((a) => a.id === test?.agent_b_id);

  const handleSend = async () => {
    if (!input.trim() || streamingA || streamingB) return;
    const userContent = input.trim();
    setInput("");

    const userMsg: SideMessage = { id: Date.now().toString(), role: "user", content: userContent };
    setMessagesA((prev) => [...prev, userMsg]);
    setMessagesB((prev) => [...prev, { ...userMsg, id: userMsg.id + "-b" }]);

    // Stream both agents in parallel
    const streamSide = (
      agentId: string | undefined,
      setMsgs: React.Dispatch<React.SetStateAction<SideMessage[]>>,
      setStreaming: React.Dispatch<React.SetStateAction<boolean>>,
      allPrevMsgs: SideMessage[],
      streamId: string
    ) => {
      setStreaming(true);
      let soFar = "";
      const allMessages = [
        ...allPrevMsgs.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userContent },
      ];

      return streamChat({
        messages: allMessages,
        agentId,
        onDelta: (chunk) => {
          soFar += chunk;
          setMsgs((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === streamId) {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: soFar } : m));
            }
            return [...prev, { id: streamId, role: "assistant" as const, content: soFar }];
          });
        },
        onDone: () => {
          setStreaming(false);
          setMsgs((prev) => prev.map((m) => (m.id === streamId ? { ...m, id: Date.now().toString() } : m)));
        },
        onError: (err) => {
          setStreaming(false);
          toast.error(err);
        },
      });
    };

    await Promise.all([
      streamSide(test?.agent_a_id, setMessagesA, setStreamingA, messagesA, "stream-a"),
      streamSide(test?.agent_b_id, setMessagesB, setStreamingB, messagesB, "stream-b"),
    ]);
  };

  const handleVote = (winner: "a" | "b" | "tie") => {
    setVotes((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
    toast.success(`Vote recorded: ${winner === "tie" ? "Tie" : `Agent ${winner.toUpperCase()} wins`}`);
  };

  if (!test) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  const renderMessages = (msgs: SideMessage[], agentName: string, endRef: React.RefObject<HTMLDivElement>) => (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {msgs.map((msg) => (
        <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user" ? "gradient-primary text-primary-foreground rounded-br-md" : "bg-secondary rounded-bl-md"}`}>
            {msg.role === "assistant" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-0.5">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            )}
          </div>
        </motion.div>
      ))}
      <div ref={endRef} />
    </div>
  );

  const total = votes.a + votes.b + votes.tie;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/ab-testing")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold">{test.name}</h1>
          <Badge variant="default" className="rounded-full text-xs mt-1">{test.status}</Badge>
        </div>
      </div>

      {/* Vote Summary */}
      {total > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-6">
            <span className="text-sm font-medium">Results ({total} votes):</span>
            <span className="text-sm">A: <strong>{votes.a}</strong> ({total > 0 ? Math.round((votes.a / total) * 100) : 0}%)</span>
            <span className="text-sm">B: <strong>{votes.b}</strong> ({total > 0 ? Math.round((votes.b / total) * 100) : 0}%)</span>
            <span className="text-sm">Tie: <strong>{votes.tie}</strong></span>
          </CardContent>
        </Card>
      )}

      {/* Split Screen Chat */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-16rem)]">
        {/* Agent A */}
        <Card className="rounded-2xl flex flex-col overflow-hidden">
          <CardHeader className="py-2 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-sm">{agentA?.avatar || "A"}</div>
              <CardTitle className="text-sm">Agent A: {agentA?.name || "Unknown"}</CardTitle>
            </div>
          </CardHeader>
          {renderMessages(messagesA, agentA?.name || "A", endRefA)}
        </Card>

        {/* Agent B */}
        <Card className="rounded-2xl flex flex-col overflow-hidden">
          <CardHeader className="py-2 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-sm">{agentB?.avatar || "B"}</div>
              <CardTitle className="text-sm">Agent B: {agentB?.name || "Unknown"}</CardTitle>
            </div>
          </CardHeader>
          {renderMessages(messagesB, agentB?.name || "B", endRefB)}
        </Card>
      </div>

      {/* Vote buttons */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => handleVote("a")} disabled={streamingA || streamingB}>
          <ThumbsUp className="h-4 w-4" /> A wins
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => handleVote("tie")} disabled={streamingA || streamingB}>
          Tie
        </Button>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => handleVote("b")} disabled={streamingA || streamingB}>
          B wins <ThumbsUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Input */}
      <div className="flex gap-2 max-w-3xl mx-auto">
        <Input
          placeholder="Type a message to send to both agents..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="rounded-xl"
          disabled={streamingA || streamingB}
        />
        <Button className="gradient-primary text-primary-foreground rounded-xl" onClick={handleSend} disabled={!input.trim() || streamingA || streamingB}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
