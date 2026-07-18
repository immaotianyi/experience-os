/**
 * Test suite for llmAdapter.js — mock adapter, factory, prompt templates.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MockLLMAdapter,
  createLLMAdapter,
  PROMPT_TEMPLATES,
  fillTemplate,
  BaseLLMAdapter
} from "../src/llmAdapter.js";

describe("MockLLMAdapter", () => {
  it("returns structured JSON for thought extraction", async () => {
    const llm = new MockLLMAdapter();
    const result = await llm.complete({
      prompt: "提取 ThoughtFragment from this conversation",
      system: "test"
    });

    assert.ok(result.content);
    const parsed = JSON.parse(result.content);
    assert.ok(parsed.summary);
    assert.ok(parsed.themes);
    assert.ok(parsed.themes.includes("skill_growth"));
  });

  it("returns structured JSON for skill candidate generation", async () => {
    const llm = new MockLLMAdapter();
    const result = await llm.complete({
      prompt: "generate a Skill candidate for this workflow"
    });

    const parsed = JSON.parse(result.content);
    assert.ok(parsed.name);
    assert.ok(parsed.trigger);
    assert.ok(parsed.inputSchema);
    assert.ok(parsed.outputSchema);
  });

  it("tracks token usage", async () => {
    const llm = new MockLLMAdapter();
    await llm.complete({ prompt: "test prompt for usage tracking" });
    await llm.complete({ prompt: "another prompt" });

    assert.ok(llm.totalUsage.promptTokens > 0);
    assert.ok(llm.totalUsage.completionTokens > 0);
    assert.equal(llm.totalUsage.calls, 2);
  });

  it("enforces token budget", async () => {
    const llm = new MockLLMAdapter({ maxTotalTokens: 20 });
    // First call succeeds (budget is 0 < 20), but uses up tokens
    await llm.complete({ prompt: "first call to use up budget tokens" });
    // Second call should fail — budget now exceeded
    await assert.rejects(() => llm.complete({ prompt: "second call should be blocked" }), /budget exceeded/);
  });

  it("resets usage", async () => {
    const llm = new MockLLMAdapter();
    await llm.complete({ prompt: "test" });
    llm.resetUsage();
    assert.equal(llm.totalUsage.calls, 0);
  });

  it("returns timestamp in response", async () => {
    const llm = new MockLLMAdapter();
    const result = await llm.complete({ prompt: "test" });
    assert.ok(result.timestamp);
    assert.ok(!isNaN(new Date(result.timestamp).getTime()));
  });
});

describe("createLLMAdapter factory", () => {
  it("returns MockLLMAdapter by default", () => {
    const originalOpenAI = process.env.OPENAI_API_KEY;
    const originalAnthropic = process.env.ANTHROPIC_API_KEY;
    const originalProvider = process.env.LLM_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_PROVIDER;

    const llm = createLLMAdapter();
    assert.equal(llm.name, "mock");

    if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
    if (originalAnthropic) process.env.ANTHROPIC_API_KEY = originalAnthropic;
    if (originalProvider) process.env.LLM_PROVIDER = originalProvider;
  });

  it("returns MockLLMAdapter when provider is mock", () => {
    const llm = createLLMAdapter({ provider: "mock" });
    assert.equal(llm.name, "mock");
  });
});

describe("PROMPT_TEMPLATES", () => {
  it("has templates for all pipeline stages", () => {
    assert.ok(PROMPT_TEMPLATES.draftExperienceReceipt);
    assert.ok(PROMPT_TEMPLATES.extractThoughtFragment);
    assert.ok(PROMPT_TEMPLATES.segmentSubgoal);
    assert.ok(PROMPT_TEMPLATES.generateSkillCandidate);
    assert.ok(PROMPT_TEMPLATES.derivePreference);
  });

  it("each template has system and userTemplate", () => {
    for (const [name, template] of Object.entries(PROMPT_TEMPLATES)) {
      assert.ok(template.system, `${name} missing system`);
      assert.ok(template.userTemplate, `${name} missing userTemplate`);
    }
  });
});

describe("fillTemplate", () => {
  it("fills placeholders with values", () => {
    const result = fillTemplate("Hello {name}, you are {role}", { name: "Alice", role: "admin" });
    assert.equal(result, "Hello Alice, you are admin");
  });

  it("leaves unfilled placeholders as-is", () => {
    const result = fillTemplate("Hello {name}, {missing}", { name: "Alice" });
    assert.equal(result, "Hello Alice, {missing}");
  });

  it("handles numeric values", () => {
    const result = fillTemplate("Count: {count}", { count: 42 });
    assert.equal(result, "Count: 42");
  });
});

describe("BaseLLMAdapter budget", () => {
  it("budgetRemaining decreases with usage", async () => {
    const llm = new MockLLMAdapter({ maxTotalTokens: 10000 });
    const initial = llm.budgetRemaining;
    await llm.complete({ prompt: "test prompt" });
    assert.ok(llm.budgetRemaining < initial);
  });

  it("throws on abstract _doComplete", async () => {
    const base = new BaseLLMAdapter();
    await assert.rejects(() => base._doComplete({ prompt: "x" }), /Not implemented/);
  });
});
