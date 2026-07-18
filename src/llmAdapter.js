/**
 * LLM Adapter — abstract interface + concrete adapters for OpenAI and Anthropic.
 *
 * Design:
 * - MockAdapter: deterministic responses for testing and offline dev (default).
 * - OpenAIAdapter: calls OpenAI Chat Completions API.
 * - AnthropicAdapter: calls Anthropic Messages API.
 * - createLLMAdapter(): factory that reads env vars to pick adapter.
 *
 * Usage:
 *   const llm = createLLMAdapter();
 *   const result = await llm.complete({ prompt, context, system });
 *
 * All adapters return: { content, usage: { promptTokens, completionTokens }, model }
 *
 * Cost control: each call records token usage. Callers should check
 * llm.totalUsage against a threshold before proceeding.
 */

import { nowIso } from "./domain.js";

/**
 * @typedef {Object} LLMRequest
 * @property {string} prompt - The user prompt
 * @property {string} [system] - System prompt
 * @property {Array<{role: string, content: string}>} [context] - Conversation context
 * @property {string} [model] - Override default model
 * @property {number} [maxTokens] - Max output tokens
 * @property {number} [temperature] - Sampling temperature
 */

/**
 * @typedef {Object} LLMResponse
 * @property {string} content - The generated text
 * @property {{promptTokens: number, completionTokens: number}} usage - Token usage
 * @property {string} model - Model identifier
 * @property {string} timestamp - ISO timestamp
 */

/**
 * Base adapter class. Subclasses implement _doComplete().
 */
export class BaseLLMAdapter {
  constructor(options = {}) {
    this.name = "base";
    this.defaultModel = options.model || "mock-1";
    this.defaultMaxTokens = options.maxTokens || 4096;
    this.defaultTemperature = options.temperature ?? 0.7;
    this.totalUsage = { promptTokens: 0, completionTokens: 0, calls: 0 };
    this.maxTotalTokens = options.maxTotalTokens || 100000; // 100K token budget per run
  }

  /**
   * Complete a prompt. Wraps _doComplete with usage tracking and budget enforcement.
   * @param {LLMRequest} request
   * @returns {Promise<LLMResponse>}
   */
  async complete(request) {
    if (this.totalUsage.promptTokens + this.totalUsage.completionTokens >= this.maxTotalTokens) {
      throw new Error(`LLM token budget exceeded: ${this.totalUsage.promptTokens + this.totalUsage.completionTokens} / ${this.maxTotalTokens} tokens used. Pause and notify user.`);
    }

    const response = await this._doComplete({
      prompt: request.prompt,
      system: request.system || "",
      context: request.context || [],
      model: request.model || this.defaultModel,
      maxTokens: request.maxTokens || this.defaultMaxTokens,
      temperature: request.temperature ?? this.defaultTemperature
    });

    this.totalUsage.promptTokens += response.usage.promptTokens;
    this.totalUsage.completionTokens += response.usage.completionTokens;
    this.totalUsage.calls += 1;

    return response;
  }

  /**
   * Check if budget is still available.
   */
  get budgetRemaining() {
    const used = this.totalUsage.promptTokens + this.totalUsage.completionTokens;
    return Math.max(0, this.maxTotalTokens - used);
  }

  /**
   * Reset usage tracking (for new run).
   */
  resetUsage() {
    this.totalUsage = { promptTokens: 0, completionTokens: 0, calls: 0 };
  }

  /**
   * Subclasses must implement.
   * @protected
   */
  async _doComplete(_request) {
    throw new Error("Not implemented");
  }
}

/**
 * Mock adapter — deterministic responses for testing and offline development.
 * Returns structured JSON based on prompt keywords.
 */
export class MockLLMAdapter extends BaseLLMAdapter {
  constructor(options = {}) {
    super(options);
    this.name = "mock";
    this.defaultModel = "mock-1";
  }

  async _doComplete(request) {
    const prompt = request.prompt.toLowerCase();
    const promptTokens = Math.ceil(request.prompt.length / 4);
    let content;

    // Pattern-match prompt to generate plausible structured output
    if (prompt.includes("experience receipt draft") || prompt.includes("经验收据草案")) {
      content = JSON.stringify({ phase: "协作与验证", summary: "已保存的工作节点显示：先保留原始协作与证据，再由人确认是否形成可验证的经验。", outcome: "partial", uncertainty: 0.35, counterexamples: ["尚未经过第二个真实项目复验"], applicabilityBounds: ["仅适用于用户明确同意保存的本地项目内容"], lessonsLearned: ["工作节点应先于总结保存，避免结论脱离来源"] });
    } else if (prompt.includes("thoughtfragment") || prompt.includes("thought_fragment") || prompt.includes("提取思想")) {
      content = JSON.stringify({
        summary: "将非线性思考转化为结构化工程对象",
        themes: ["skill_growth", "nonlinear_to_linear", "production_validation"],
        evidence: request.prompt.slice(0, 200)
      });
    } else if (prompt.includes("subgoal") || prompt.includes("子目标") || prompt.includes("切分")) {
      content = JSON.stringify({
        title: "定义 Skill Schema 并验证",
        intent: "从对话中提取可执行的工程子目标",
        inputs: ["对话内容", "已有 Skill 库"],
        outputs: ["Skill 候选", "验证结果"]
      });
    } else if (prompt.includes("skill") || prompt.includes("候选") || prompt.includes("candidate")) {
      content = JSON.stringify({
        name: "经验资产化 Skill",
        trigger: { intent: "将对话中的经验转化为可复用资产", signals: ["skill_growth", "nonlinear_to_linear"] },
        inputSchema: { type: "object", properties: { content: { type: "string" } } },
        outputSchema: { type: "object", properties: { skill: { type: "object" } } },
        safetyLevel: "L1",
        fallback: "返回原始对话内容，不生成 Skill",
        humanConfirmationRequired: true
      });
    } else if (prompt.includes("workflow") || prompt.includes("工作流")) {
      content = JSON.stringify({
        name: "对话到 Skill 的工作流",
        pattern: "对话事件 → 思想片段 → 子目标 → Skill 候选 → 验证 → 产物"
      });
    } else if (prompt.includes("preference") || prompt.includes("偏好")) {
      content = JSON.stringify({
        statement: "用户偏好结构化、可验证的工程产出",
        confidence: 0.85
      });
    } else {
      content = JSON.stringify({ result: "mock response", prompt_preview: request.prompt.slice(0, 100) });
    }

    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      usage: { promptTokens, completionTokens },
      model: this.defaultModel,
      timestamp: nowIso()
    };
  }
}

/**
 * OpenAI adapter — calls Chat Completions API.
 * Requires OPENAI_API_KEY environment variable.
 */
export class OpenAILLMAdapter extends BaseLLMAdapter {
  constructor(options = {}) {
    super(options);
    this.name = "openai";
    this.defaultModel = options.model || "gpt-4o";
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = options.baseURL || "https://api.openai.com/v1";

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required for OpenAILLMAdapter");
    }
  }

  async _doComplete(request) {
    const messages = [];
    if (request.system) {
      messages.push({ role: "system", content: request.system });
    }
    for (const ctx of request.context) {
      messages.push(ctx);
    }
    messages.push({ role: "user", content: request.prompt });

    const body = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0
      },
      model: data.model || request.model,
      timestamp: nowIso()
    };
  }
}

/**
 * Anthropic adapter — calls Messages API.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export class AnthropicLLMAdapter extends BaseLLMAdapter {
  constructor(options = {}) {
    super(options);
    this.name = "anthropic";
    this.defaultModel = options.model || "claude-sonnet-4-20250514";
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseURL = options.baseURL || "https://api.anthropic.com";
    this.apiVersion = options.apiVersion || "2023-06-01";

    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required for AnthropicLLMAdapter");
    }
  }

  async _doComplete(request) {
    const messages = [];
    for (const ctx of request.context) {
      if (ctx.role === "system") continue; // Anthropic uses top-level system
      messages.push({ role: ctx.role === "assistant" ? "assistant" : "user", content: ctx.content });
    }
    messages.push({ role: "user", content: request.prompt });

    const body = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens,
      system: request.system || undefined
    };

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.apiVersion
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    return {
      content,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0
      },
      model: data.model || request.model,
      timestamp: nowIso()
    };
  }
}

/**
 * Factory: create LLM adapter based on environment.
 *
 * Priority:
 * 1. LLM_PROVIDER=openai → OpenAILLMAdapter
 * 2. LLM_PROVIDER=anthropic → AnthropicLLMAdapter
 * 3. OPENAI_API_KEY set → OpenAILLMAdapter
 * 4. ANTHROPIC_API_KEY set → AnthropicLLMAdapter
 * 5. Default → MockLLMAdapter
 *
 * @param {Object} options - Override defaults
 * @returns {BaseLLMAdapter}
 */
export function createLLMAdapter(options = {}) {
  const provider = (options.provider || process.env.LLM_PROVIDER || "").toLowerCase();

  if (provider === "openai" || (!provider && process.env.OPENAI_API_KEY)) {
    try {
      return new OpenAILLMAdapter(options);
    } catch (e) {
      console.warn(`[LLM] Failed to init OpenAI adapter: ${e.message}, falling back to mock`);
    }
  }

  if (provider === "anthropic" || (!provider && process.env.ANTHROPIC_API_KEY)) {
    try {
      return new AnthropicLLMAdapter(options);
    } catch (e) {
      console.warn(`[LLM] Failed to init Anthropic adapter: ${e.message}, falling back to mock`);
    }
  }

  return new MockLLMAdapter(options);
}

/**
 * Prompt templates for each pipeline stage.
 * These define the system prompts used when calling the LLM for each transformation.
 */
export const PROMPT_TEMPLATES = {
  draftExperienceReceipt: {
    system: `You create an Experience Receipt DRAFT, not a conclusion. Use only the supplied checkpoints and evidence. Do not invent sources, outcomes, or certainty. Return JSON with: phase, summary, outcome (success|partial|failure|unknown), uncertainty (0-1 or null), counterexamples (array), applicabilityBounds (array), lessonsLearned (array). Keep the language factual and state uncertainty honestly.`,
    userTemplate: `Project: {projectId}\n\nConsented work checkpoints and evidence:\n{materials}\n\nProduce an Experience Receipt DRAFT as JSON.`
  },
  extractThoughtFragment: {
    system: `You are an experience asset extraction engine. Given a conversation event, extract the core thought as a ThoughtFragment. Return JSON with: summary (string), themes (array of strings from: skill_growth, nonlinear_to_linear, production_validation, schema_design, wallhit_feedback, human_review, reuse_context), evidence (string, the raw text that supports this thought).`,
    userTemplate: `Project: {projectId}\nActor: {actor}\nContent: {content}\n\nExtract the ThoughtFragment as JSON.`
  },

  segmentSubgoal: {
    system: `You are a subgoal segmentation engine. Given a human edit log, break it down into a SubgoalSegment. Return JSON with: title (string), intent (string), inputs (array of strings), outputs (array of strings).`,
    userTemplate: `Edit type: {editType}\nBefore: {before}\nAfter: {after}\nRationale: {rationale}\n\nCreate the SubgoalSegment as JSON.`
  },

  generateSkillCandidate: {
    system: `You are a skill candidate generator. Given context about a workflow pattern, generate a SkillCandidate. Return JSON with: name (string), trigger (object with intent and signals array), inputSchema (JSON schema object), outputSchema (JSON schema object), safetyLevel (string: L1-L4), fallback (string), humanConfirmationRequired (boolean).`,
    userTemplate: `Workflow: {workflowName}\nPattern: {pattern}\nSubgoal: {subgoalTitle}\nIntent: {intent}\n\nGenerate the SkillCandidate as JSON.`
  },

  derivePreference: {
    system: `You are a preference hypothesis generator. Given a human edit log, infer the user's implicit preference. Return JSON with: statement (string), confidence (number 0-1).`,
    userTemplate: `Edit type: {editType}\nBefore: {before}\nAfter: {after}\nRationale: {rationale}\nSignals: {signals}\n\nInfer the preference as JSON.`
  }
};

/**
 * Fill a prompt template with values.
 * @param {string} template - Template string with {placeholders}
 * @param {Object} values - Key-value pairs to fill
 * @returns {string}
 */
export function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}
