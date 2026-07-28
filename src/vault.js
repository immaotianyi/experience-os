/**
 * Vault — Experience OS 的本地 JSON 文件存储层。
 *
 * 做什么：
 *   把所有 EOS 领域记录（Project、Artifact、Skill、ReviewPacket、Transaction 等 28+ 种）
 *   持久化为磁盘上的 JSON 文件。每个 record kind 对应一个子目录（collection），每个 record
 *   对应一个 `${id}.json` 文件。不使用数据库，零外部依赖。
 *
 * 核心抽象：
 *   - Vault 实例绑定到一个根目录（rootDir），是该目录下所有 collection 的唯一写入入口。
 *   - 上层引擎（projectEngine / reviewEngine / marketplace / reuseEngine 等）只通过
 *     save/load/list/search 四个方法访问数据，不直接读写文件。
 *   - COLLECTION_DIR 是 kind → 子目录名的权威映射，新增 record kind 必须在此注册。
 *
 * 关键不变量（invariants）：
 *   1. 原子写入：save() 先写 .tmp 文件再 POSIX rename，保证任意时刻文件要么完整要么不存在，
 *      不会出现半截 JSON。进程崩溃不会损坏已存在的记录。
 *   2. ID 白名单：所有 record.id 必须匹配 SAFE_ID_RE（[a-zA-Z0-9._-]+），防止路径穿越。
 *   3. 容错 list：单个损坏的 JSON 文件不会让整个 list() 失败，文件被跳过并记录 warning，
 *      上层始终得到一个可用数组（单文件损坏 ≠ 集合不可用）。
 *   4. 无 schema 校验：Vault 不验证字段，只负责序列化/反序列化。字段校验由 validate.js 负责。
 *
 * 设计取舍（why not a database）：
 *   - GitVault（gitVault.js）在此基础上叠加 git 版本控制，让每条记录的历史可追溯、可回滚。
 *   - 文件级存储让用户能直接打开 .eos/vault/ 查看数据，无黑盒，无迁移负担。
 *   - 搜索使用简单子串匹配（tokenize + scoreRecord），而非全文索引。对 EOS 的规模（单 vault
 *     通常 <10k 条记录）足够；如果未来需要向量语义搜索，在 search() 上层替换实现即可。
 *
 * 不做什么：
 *   - 不提供事务（事务由上层 GitVault.withTransaction() 提供，基于备份+恢复）。
 *   - 不做并发锁（并发写同一 ID 的保护由调用方用队列/锁保证；marketplace 等已有 write lock）。
 *   - 不做网络或加密，Vault 是纯本地文件抽象。
 */

import { mkdir, writeFile, readFile, readdir, rename } from "node:fs/promises";
import path from "node:path";

/**
 * Record kind → collection 子目录名的权威映射。
 * 新增领域记录类型时必须：
 *   1. 在 domain.js 中添加 create* 工厂函数
 *   2. 在此映射中注册 kind → 目录名
 *   3. 如果该类型要走 git 版本控制，确保 gitVault 不需要特殊处理
 * 目录名用 kebab-case，文件系统友好；kind 用 PascalCase，与工厂函数一致。
 */
const COLLECTION_DIR = Object.freeze({
  Project: "projects",
  ConversationEvent: "events",
  ThoughtFragment: "thoughts",
  Artifact: "artifacts",
  Rule: "rules",
  Skill: "skills",
  WallHit: "wallhits",
  HumanEditLog: "human-edit-logs",
  SubgoalSegment: "subgoal-segments",
  WorkflowPattern: "workflow-patterns",
  PreferenceHypothesis: "preference-hypotheses",
  ReflectionMemory: "reflection-memories",
  MotherSkillTrajectory: "mother-skill-trajectories",
  ReuseContext: "reuse-contexts",
  SelfIterationRun: "self-iteration-runs",
  ReviewPacket: "review-packets",
  ReviewDecision: "review-decisions",
  MarketplaceListing: "marketplace-listings",
  Transaction: "transactions",
  SkillRating: "skill-ratings",
  EvidenceLink: "evidence-links",
  ExperienceReceipt: "experience-receipts",
  ExperienceReceiptDraft: "experience-receipt-drafts",
  DecisionReceipt: "decision-receipts",
  OutcomeRecord: "outcome-records",
  ExperienceAsset: "experience-assets",
  ExperienceReuseTrial: "experience-reuse-trials",
  BetaFeedback: "beta-feedback",
  WorkCheckpoint: "work-checkpoints",
  CodeGraphPattern: "code-graph-patterns",
  CodeGraphSnapshot: "code-graph-snapshots"
});

const KIND_BY_COLLECTION = Object.fromEntries(
  Object.entries(COLLECTION_DIR).map(([kind, dir]) => [dir, kind])
);

// ID format whitelist — prevents path traversal (../, /, \, null bytes)
const SAFE_ID_RE = /^[a-zA-Z0-9._\-]+$/;

function validateId(id) {
  if (typeof id !== "string" || id.length === 0 || id.length > 512) {
    throw new Error(`Invalid record id: must be a non-empty string (max 512 chars)`);
  }
  if (!SAFE_ID_RE.test(id)) {
    throw new Error(`Invalid record id: contains forbidden characters (only [a-zA-Z0-9._-] allowed): ${id.slice(0, 40)}`);
  }
  if (id.includes("..")) {
    throw new Error(`Invalid record id: path traversal sequence detected: ${id.slice(0, 40)}`);
  }
}

/**
 * 本地 JSON 文件存储。一个 Vault 实例对应磁盘上的一个根目录。
 *
 * 典型生命周期：
 *   const vault = new Vault(vaultDir);
 *   await vault.init();                 // 建目录（等幂）
 *   await vault.save(record);           // 原子写入一条记录
 *   const p = await vault.load("Project", id);  // 读一条，不存在返回 null
 *   const all = await vault.list("Artifact");   // 列一个 collection
 *
 * 线程/进程安全：
 *   本类不做文件锁。单进程内由调用方保证对同一 ID 的串行写入；多进程并发写同一文件
 *   是未定义行为（POSIX rename 原子但可能 last-writer-wins）。
 */
export class Vault {
  /**
   * @param {string} rootDir - Vault 根目录的绝对路径（通常是 .eos/vault 或 work/vaults/real）。
   *   不存在时 init() 会创建；已存在时直接复用。
   */
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  /**
   * 初始化所有 collection 子目录。等幂：已存在的目录不会报错。
   * 必须在第一次 save/load/list 之前调用一次。
   */
  async init() {
    await mkdir(this.rootDir, { recursive: true });
    await Promise.all(
      Object.values(COLLECTION_DIR).map((dir) => mkdir(path.join(this.rootDir, dir), { recursive: true }))
    );
  }

  /**
   * 计算一条记录在磁盘上的文件路径。
   * 同时校验 record.kind 已注册、record.id 符合白名单（防路径穿越）。
   * @param {{kind: string, id: string}} record - 必须带 kind 和 id
   * @returns {string} 绝对文件路径
   * @throws {Error} kind 未注册 或 id 含非法字符
   */
  fileFor(record) {
    const dir = COLLECTION_DIR[record.kind];
    if (!dir) throw new Error(`Unsupported record kind: ${record.kind}`);
    validateId(record.id);
    return path.join(this.rootDir, dir, `${record.id}.json`);
  }

  /**
   * 原子写入一条记录。
   * 策略：先写 ${path}.tmp，写完后 rename 到最终路径。POSIX rename 在同一文件系统上是原子的，
   * 因此读者要么看到旧版本，要么看到新版本，永远不会看到半截 JSON。
   * @param {object} record - 任意可 JSON.stringify 的对象，必须含 kind 和 id
   * @returns {Promise<string>} 写入的文件绝对路径
   */
  async save(record) {
    const filePath = this.fileFor(record);
    // Ensure the collection directory exists (atomic write still holds)
    await mkdir(path.dirname(filePath), { recursive: true });
    // Atomic write: write to .tmp then rename (POSIX rename is atomic)
    const tmpPath = filePath + ".tmp";
    await writeFile(tmpPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(tmpPath, filePath);
    return filePath;
  }

  /**
   * 读取一条记录。
   * @param {string} kind - 记录类型（PascalCase，必须在 COLLECTION_DIR 中注册）
   * @param {string} id - 记录 ID
   * @returns {Promise<object|null>} 解析后的记录对象；文件不存在返回 null（不抛异常）
   * @throws {Error} kind 未注册、id 非法、或文件内容不是合法 JSON
   */
  async load(kind, id) {
    const dir = COLLECTION_DIR[kind];
    if (!dir) throw new Error(`Unsupported record kind: ${kind}`);
    validateId(id);
    const filePath = path.join(this.rootDir, dir, `${id}.json`);
    let content;
    try {
      content = await readFile(filePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Corrupt record file at ${filePath}: ${error.message}`);
    }
  }

  /**
   * 列出一个 collection 下的所有记录。
   * 容错策略：单个 .json 文件损坏/不可读不会中断整个 list，被跳过并汇总到 skipped。
   * @param {string} kind - 记录类型
   * @param {object} [options]
   * @param {boolean} [options.collectSkipped=false] - 为 true 时返回 {records, skipped} 而非 records
   * @returns {Promise<object[]|{records: object[], skipped: {file:string,error:string}[]}>}
   */
  async list(kind, options = {}) {
    const dir = COLLECTION_DIR[kind];
    if (!dir) throw new Error(`Unsupported record kind: ${kind}`);
    const folder = path.join(this.rootDir, dir);
    const files = await readdir(folder).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const records = [];
    const skipped = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(folder, file);
      try {
        const content = await readFile(filePath, "utf8");
        records.push(JSON.parse(content));
      } catch (error) {
        // A single corrupt/unreadable file must not poison the whole collection.
        skipped.push({ file, error: error.code || error.name });
      }
    }
    if (options.collectSkipped) {
      return { records, skipped };
    }
    if (skipped.length > 0) {
      console.warn(`[Vault] ${skipped.length} corrupt/unreadable file(s) skipped in ${dir}`);
    }
    return records;
  }

  /**
   * 列出所有 collection 下的所有记录（全量扫描）。
   * 主要用于管理界面和搜索；生产路径应优先用 list(kind) 避免不必要的 IO。
   * @returns {Promise<object[]>}
   */
  async listAll() {
    const collections = Object.values(COLLECTION_DIR);
    const records = [];
    for (const dir of collections) {
      const kind = KIND_BY_COLLECTION[dir];
      records.push(...(await this.list(kind)));
    }
    return records;
  }

  /**
   * 简单全文搜索。
   * 算法：把 query 按非字母数字/中文分隔成 term，对每条记录的 JSON.stringify 结果做子串匹配，
   * 命中 term 数量即为 score。按 score 降序返回前 limit 条。
   *
   * 设计取舍：这是布尔子串匹配，不是 TF-IDF 也不是向量搜索。对单 vault <10k 条记录足够快且无依赖。
   * 若未来需要语义搜索，应在此方法上层包装向量召回，不要替换此实现（它还是管理 UI 的依赖）。
   *
   * @param {object} params
   * @param {string} params.query - 搜索关键词
   * @param {string[]|null} [params.kinds=null] - 限定在这些 kind 内搜索；null 表示全部
   * @param {number} [params.limit=10] - 返回条数上限
   * @returns {Promise<{record: object, score: number}[]>}
   */
  async search({ query, kinds = null, limit = 10 }) {
    const terms = tokenize(query);
    const validKinds = kinds ? kinds.filter((k) => COLLECTION_DIR[k]) : null;
    const records = validKinds
      ? (await Promise.all(validKinds.map((kind) => this.list(kind)))).flat()
      : await this.listAll();

    return records
      .map((record) => ({ record, score: scoreRecord(record, terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.record.id).localeCompare(String(b.record.id)))
      .slice(0, limit);
  }
}

/**
 * 把查询字符串切成小写 term。支持 ASCII 和中文（CJK 统一表意区间 U+4E00-U+9FA5）。
 * 连续的非字母数字/中文字符作为分隔符。
 */
function tokenize(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/g)
    .map((term) => term.trim())
    .filter(Boolean);
}

/**
 * 给一条记录打分：命中一个 term 加 1 分。
 * 简单但可预测；不做字段权重。
 */
function scoreRecord(record, terms) {
  const text = JSON.stringify(record).toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}
