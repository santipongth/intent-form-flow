import { describe, it, expect } from "vitest";
import { getUserPrompt, getSkills, withPromptAndSkills } from "./agentTools";

describe("getUserPrompt", () => {
  it("returns empty string for null", () => {
    expect(getUserPrompt(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getUserPrompt(undefined)).toBe("");
  });

  it("returns empty string when _userPrompt is missing", () => {
    expect(getUserPrompt({ "web-search": true })).toBe("");
  });

  it("returns empty string when _userPrompt is wrong type", () => {
    expect(getUserPrompt({ _userPrompt: 42 } as any)).toBe("");
    expect(getUserPrompt({ _userPrompt: null } as any)).toBe("");
    expect(getUserPrompt({ _userPrompt: ["a"] } as any)).toBe("");
  });

  it("returns the string verbatim (preserving whitespace + templates)", () => {
    expect(getUserPrompt({ _userPrompt: "  คำถาม: {{question}}  " })).toBe(
      "  คำถาม: {{question}}  ",
    );
  });

  it("ignores tools that is not an object (string, array, number)", () => {
    expect(getUserPrompt("oops" as any)).toBe("");
    expect(getUserPrompt(["x"] as any)).toBe("");
    expect(getUserPrompt(123 as any)).toBe("");
  });
});

describe("getSkills", () => {
  it("returns [] for null/undefined/missing", () => {
    expect(getSkills(null)).toEqual([]);
    expect(getSkills(undefined)).toEqual([]);
    expect(getSkills({ "web-search": true })).toEqual([]);
  });

  it("returns [] when _skills is wrong type", () => {
    expect(getSkills({ _skills: "FAQ" } as any)).toEqual([]);
    expect(getSkills({ _skills: { 0: "x" } } as any)).toEqual([]);
    expect(getSkills({ _skills: null } as any)).toEqual([]);
  });

  it("filters non-string items", () => {
    expect(getSkills({ _skills: ["FAQ", 1, null, undefined, { a: 1 }, "Triage"] } as any))
      .toEqual(["FAQ", "Triage"]);
  });

  it("trims and drops empty strings", () => {
    expect(getSkills({ _skills: ["  FAQ  ", "", "   ", "Triage"] })).toEqual([
      "FAQ",
      "Triage",
    ]);
  });

  it("de-duplicates case-insensitively, keeping first occurrence", () => {
    expect(getSkills({ _skills: ["FAQ", "faq", "Faq", "Triage"] })).toEqual([
      "FAQ",
      "Triage",
    ]);
  });

  it("preserves Thai skill names exactly", () => {
    expect(getSkills({ _skills: ["สรุปข่าว", "ตอบลูกค้า"] })).toEqual([
      "สรุปข่าว",
      "ตอบลูกค้า",
    ]);
  });
});

describe("withPromptAndSkills", () => {
  it("creates a fresh object when tools is null", () => {
    const out = withPromptAndSkills(null, "hi", ["a"]);
    expect(out).toEqual({ _userPrompt: "hi", _skills: [{ name: "a", instructions: "" }] });
  });

  it("preserves unrelated tool toggles", () => {
    const out = withPromptAndSkills(
      { "web-search": true, calculator: false, _userPrompt: "old", _skills: ["x"] },
      "new",
      ["y", "z"],
    );
    expect(out).toEqual({
      "web-search": true,
      calculator: false,
      _userPrompt: "new",
      _skills: [
        { name: "y", instructions: "" },
        { name: "z", instructions: "" },
      ],
    });
  });

  it("does not mutate the input object", () => {
    const input = { _userPrompt: "old", _skills: ["x"], "web-search": true };
    const snapshot = JSON.parse(JSON.stringify(input));
    withPromptAndSkills(input, "new", ["y"]);
    expect(input).toEqual(snapshot);
  });

  it("survives a round-trip through getUserPrompt / getSkills", () => {
    const merged = withPromptAndSkills({ "web-search": true }, "ทดสอบ", [
      "FAQ",
      "Triage",
    ]);
    expect(getUserPrompt(merged)).toBe("ทดสอบ");
    expect(getSkills(merged)).toEqual(["FAQ", "Triage"]);
  });

  it("multi-edit round-trip: load → edit → save → load → edit again", () => {
    // Start from a legacy row with no embedded fields.
    let tools: any = { "web-search": true };

    // First edit
    tools = withPromptAndSkills(tools, "v1", ["FAQ"]);
    expect(getUserPrompt(tools)).toBe("v1");
    expect(getSkills(tools)).toEqual(["FAQ"]);
    expect(tools["web-search"]).toBe(true);

    // Second edit with a duplicate + empty + Thai entry
    tools = withPromptAndSkills(tools, "v2", ["FAQ", "faq", "  Triage  ", "", "ตอบลูกค้า"]);
    // What we save is the raw array (validation happens upstream),
    // but readback should normalize.
    expect(getUserPrompt(tools)).toBe("v2");
    expect(getSkills(tools)).toEqual(["FAQ", "Triage", "ตอบลูกค้า"]);

    // Third edit clears the prompt and shrinks skills
    tools = withPromptAndSkills(tools, "", ["Triage"]);
    expect(getUserPrompt(tools)).toBe("");
    expect(getSkills(tools)).toEqual(["Triage"]);
    expect(tools["web-search"]).toBe(true);
  });
});

describe("skill entries with instructions", () => {
  it("reads the legacy string[] shape as entries without instructions", () => {
    expect(getSkillEntries({ _skills: ["FAQ", " Triage "] })).toEqual([
      { name: "FAQ", instructions: "" },
      { name: "Triage", instructions: "" },
    ]);
  });

  it("reads the object shape and de-duplicates case-insensitively", () => {
    expect(
      getSkillEntries({
        _skills: [
          { name: "ตอบลูกค้า", instructions: "บทบาท: ..." },
          { name: "ตอบลูกค้า", instructions: "ซ้ำ" },
          { name: "", instructions: "x" },
          42,
        ],
      } as any),
    ).toEqual([{ name: "ตอบลูกค้า", instructions: "บทบาท: ..." }]);
  });

  it("snapshots instructions from the catalog when saving", () => {
    const entries = toSkillEntries(["ตอบลูกค้า", "ไม่มีในคลัง"], [
      { name: "ตอบลูกค้า", instructions: "ทำ A แล้ว B" },
    ]);
    expect(entries).toEqual([
      { name: "ตอบลูกค้า", instructions: "ทำ A แล้ว B" },
      { name: "ไม่มีในคลัง", instructions: "" },
    ]);
    const merged = withPromptAndSkills({ "web-search": true }, "", entries);
    expect(getSkillEntries(merged)).toEqual(entries);
    expect(getSkills(merged)).toEqual(["ตอบลูกค้า", "ไม่มีในคลัง"]);
  });

  it("renders instructions into the prompt block", () => {
    const block = renderSkillBlock([{ name: "สรุป", instructions: "ข้อ 1\nข้อ 2" }]);
    expect(block).toContain("- สรุป");
    expect(block).toContain("    ข้อ 1");
    expect(block).toContain("    ข้อ 2");
    expect(renderSkillBlock([])).toBe("");
  });
});
