import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useSkills, useCreateSkill } from "@/hooks/useSkills";
import { toast } from "sonner";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  templateSkills?: string[];
  disabled?: boolean;
};

/**
 * Multi-select dropdown that picks skill names from the user's catalog.
 * - Selected skills are stored as plain strings (skill names) so the existing
 *   `_skills` agent shape keeps working.
 * - Allows quickly creating a new catalog skill from the search box.
 */
export function SkillSelector({ value, onChange, max = 15, templateSkills = [], disabled }: Props) {
  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((s) => s !== name));
    } else {
      if (value.length >= max) {
        toast.error(`Maximum ${max} skills`);
        return;
      }
      onChange([...value, name]);
    }
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toggle(skills.find((s) => s.name.toLowerCase() === name.toLowerCase())!.name);
      setSearch("");
      return;
    }
    try {
      const created = await createSkill.mutateAsync({ name });
      toggle(created.name);
      setSearch("");
      toast.success(`Added "${created.name}" to your catalog`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create skill");
    }
  };

  const showCreate =
    search.trim().length > 0 &&
    !skills.some((s) => s.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground">No skills selected yet.</span>
        )}
        {value.map((sk) => {
          const fromTemplate = templateSkills.includes(sk);
          return (
            <span
              key={sk}
              className={`inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-1 ${
                fromTemplate
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {sk}
              {fromTemplate && <span className="text-[9px] opacity-70">• template</span>}
              <button
                type="button"
                onClick={() => toggle(sk)}
                className="opacity-60 hover:opacity-100"
                aria-label={`Remove ${sk}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="justify-between rounded-xl flex-1"
            >
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading skills…" : "Select skills from your catalog"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search or create…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {skills.length === 0
                    ? "No skills yet — type a name and press Create."
                    : "No matching skill."}
                </CommandEmpty>
                {skills.length > 0 && (
                  <CommandGroup heading="Your skills">
                    {skills.map((s) => {
                      const selected = value.includes(s.name);
                      return (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => toggle(s.name)}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                          <div className="flex flex-col">
                            <span>{s.name}</span>
                            {s.description && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {s.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {showCreate && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={handleCreate} disabled={createSkill.isPending}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create &quot;{search.trim()}&quot;
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem asChild>
                    <Link to="/skills" className="flex items-center">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Manage skills catalog
                    </Link>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}