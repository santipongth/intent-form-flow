import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FlaskConical, ArrowRight, BarChart3, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "@/hooks/useAgents";
import { useABTests, useCreateABTest, useDeleteABTest } from "@/hooks/useABTesting";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ABTesting() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: agents } = useAgents();
  const { data: tests } = useABTests();
  const createTest = useCreateABTest();
  const deleteTest = useDeleteABTest();

  const [open, setOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [agentAId, setAgentAId] = useState("");
  const [agentBId, setAgentBId] = useState("");

  const handleCreate = async () => {
    if (!testName || !agentAId || !agentBId) return;
    const test = await createTest.mutateAsync({ name: testName, agentAId, agentBId });
    setOpen(false);
    setTestName("");
    setAgentAId("");
    setAgentBId("");
    navigate(`/ab-testing/${test.id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">🧪 {t("abtest.title") || "A/B Testing"}</h1>
          <p className="text-muted-foreground text-sm">{t("abtest.subtitle") || "Compare two agents side-by-side"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/ab-testing/results")}>
            <BarChart3 className="h-4 w-4" /> {t("abtest.viewResults")}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2">
              <Plus className="h-4 w-4" /> {t("abtest.create") || "New Test"}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("abtest.createNew") || "Create A/B Test"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Test Name</Label>
                <Input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Friendly vs Professional" className="rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Agent A</Label>
                  <Select value={agentAId} onValueChange={setAgentAId}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {agents?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Agent B</Label>
                  <Select value={agentBId} onValueChange={setAgentBId}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {agents?.filter((a) => a.id !== agentAId).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground rounded-xl" onClick={handleCreate} disabled={!testName || !agentAId || !agentBId}>
                Create Test
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {tests && tests.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {tests.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="rounded-2xl hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/ab-testing/${test.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{test.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={test.status === "active" ? "default" : "secondary"} className="rounded-full text-xs">
                        {test.status}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl" onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("abtest.deleteConfirmTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("abtest.deleteConfirmDesc")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("abtest.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                deleteTest.mutate(test.id);
                                toast.success(t("abtest.deleteSuccess"));
                              }}
                            >
                              {t("abtest.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Agent A</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>vs</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>Agent B</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(test.created_at).toLocaleDateString("th-TH")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No A/B tests yet — create your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
