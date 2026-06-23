import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill, type Skill } from "@/hooks/useSkills";
import { toast } from "sonner";

export default function Skills() {
  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toDelete, setToDelete] = useState<Skill | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    if (trimmed.length > 40) {
      toast.error("Name must be 40 characters or less");
      return;
    }
    try {
      if (editing) {
        await updateSkill.mutateAsync({ id: editing.id, name: trimmed, description });
        toast.success("Skill updated");
      } else {
        await createSkill.mutateAsync({ name: trimmed, description });
        toast.success("Skill created");
      }
      setDialogOpen(false);
    } catch (e: any) {
      const msg = e?.message?.includes("duplicate") ? "A skill with that name already exists" : e?.message;
      toast.error(msg ?? "Failed to save skill");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSkill.mutateAsync(toDelete.id);
      toast.success("Skill deleted");
      setToDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete skill");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Skills Catalog
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage a standard list of skills your agents can pick from. Keeping skill names consistent
            makes agents easier to compare and reuse.
          </p>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground rounded-xl gap-2">
          <Plus className="h-4 w-4" />
          New skill
        </Button>
      </motion.div>

      <Card className="rounded-2xl glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? "Loading…" : `${skills.length} skill${skills.length === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && skills.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No skills yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first skill to start building a reusable catalog.
              </p>
              <Button onClick={openCreate} className="mt-4 rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                New skill
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {skills.map((s) => (
                <li key={s.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(s)}
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setToDelete(s)}
                      aria-label={`Delete ${s.name}`}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit skill" : "New skill"}</DialogTitle>
              <DialogDescription>
                A short, recognizable name like &quot;Translation&quot; or &quot;SQL queries&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="skill-name">Name</Label>
                <Input
                  id="skill-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Customer support"
                  maxLength={40}
                  className="rounded-xl mt-1"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="skill-desc">Description (optional)</Label>
                <Textarea
                  id="skill-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this skill cover?"
                  className="rounded-xl mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSkill.isPending || updateSkill.isPending}
                className="gradient-primary text-primary-foreground rounded-xl"
              >
                {editing ? "Save changes" : "Create skill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.name}&quot; will be removed from your catalog. Agents that already use this
              skill name will keep it until you edit them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}