// Local training prototype. No AI service, authentication, or server storage is connected.
const KEY = "lijiao-training-v1";
const $ = (selector, scope = document) => scope.querySelector(selector);
const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const date = () => new Date().toLocaleDateString("zh-CN");
const id = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const empty = () => ({ designs: [], simulations: [], assignments: [], reflections: [], videos: [], tasks: [], submissions: [], resources: [], policy: "" });
let data = empty();
let storageError = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && Array.isArray(saved[key])) data[key] = saved[key];
    if (key === "policy" && typeof saved[key] === "string") data[key] = saved[key];
  }
} catch { storageError = true; }
let role = "student";
let page = "home";
let notice = "";
let scenarioStep = 0;
const root = $("#training-app");
const original = $("#root");
const legacyBack = document.createElement("button");
legacyBack.className = "wb-legacy-back";
legacyBack.textContent = "返回实训平台";
legacyBack.hidden = true;
document.body.append(legacyBack);

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch { notice = "本机存储不可用或已满，本次修改未能保存。请检查浏览器设置。"; return false; }
}
function setNotice(message) { notice = message; render(); }
function add(key, entry, message) {
  data[key].unshift({ id: id(), date: date(), ...entry });
  if (!save()) data[key].shift();
  else notice = message;
  render();
}
function field(name, label, kind = "input", hint = "") {
  const control = kind === "textarea"
    ? `<textarea name="${name}" rows="5" placeholder="${h(hint)}"></textarea>`
    : `<input name="${name}" type="${kind}" placeholder="${h(hint)}" ${kind === "file" ? 'accept="image/*,audio/*,video/*,.pdf,.txt"' : ""}>`;
  return `<label class="wb-field"><span>${label}</span>${control}</label>`;
}
function select(name, label, options) {
  return `<label class="wb-field"><span>${label}</span><select name="${name}">${options.map((o) =>
    `<option value="${h(o[0])}">${h(o[1])}</option>`).join("")}</select></label>`;
}
function card(title, text, icon, target, badge = "") {
  return `<button class="wb-module" type="button" data-page="${target}">
    <span class="wb-module-icon">${icon}</span><span class="wb-module-body">
    <span class="wb-module-top">${badge ? `<em>${badge}</em>` : ""}</span>
    <strong>${title}</strong><small>${text}</small><span class="wb-module-more">进入模块 →</span></span></button>`;
}
function panel(title, content, subtitle = "") {
  return `<section class="wb-panel"><div class="wb-panel-head"><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${content}</section>`;
}
function placeholder(text) { return `<p class="wb-empty">${text}</p>`; }
function tags(items) { return items.map((x) => `<span class="wb-tag">${x}</span>`).join(""); }
const nav = {
  student: [["home", "总览"], ["design", "教学设计"], ["simulate", "课堂实训"], ["assignment", "作业与评价"], ["reflect", "教学反思"], ["portfolio", "成长档案"], ["boundary", "AI 使用边界"]],
  teacher: [["tasks", "任务与权限"], ["reviews", "批阅指导"], ["statistics", "班级统计"]],
  resources: [["library", "校内资源库"], ["examples", "使用示范"]],
  admin: [["users", "用户与制度"], ["resource-admin", "资源审核"], ["overview", "数据总览"]]
};
const titles = {
  home: ["我的实训空间", "从独立思考开始，让工具服务于教学判断。"],
  design: ["教学设计审辨工坊", "先提出自己的设计，再检查外部生成内容并留下修改证据。"],
  simulate: ["课堂全流程实训", "用情景脚本练习应变；视频观察需要本人或指导教师记录。"],
  assignment: ["作业与评价练习", "围绕难度梯度和学生差异练习作业设计与评语。"],
  reflect: ["教学复盘与反思", "通过阶梯问题写下自己的证据与下一步行动。"],
  portfolio: ["个人数字实训档案", "查看本地练习记录；原有视频附件和雷达图在旧版档案中。"],
  boundary: ["AI 使用边界", "明确人机分工，警惕未经核实的生成内容。"],
  tasks: ["实训任务与权限", "教师设定任务约束，提交记录由人工最终研判。"],
  reviews: ["实训批阅与指导", "查看本机演示提交并给出人工反馈。"],
  statistics: ["班级实训统计", "仅汇总本浏览器内录入的练习数据。"],
  library: ["校内教学资源库", "仅展示经本机管理员审核的自有或已授权资源条目。"],
  examples: ["AI 辅助教学示范", "从案例理解辅助与代写之间的边界。"],
  users: ["用户与制度配置", "此处只演示制度展示；正式账号权限需服务端实现。"],
  "resource-admin": ["资源维护与审核", "核验来源及授权后，资源才能在公共库显示。"],
  overview: ["平台数据总览", "本机样例汇总，不代表全校真实使用行为。"]
};
const roleNames = { student: "职前教师实训端", teacher: "指导教师管理端", resources: "教学资源支撑", admin: "后台系统管理端" };
function section(label, body) { return `<div class="wb-section"><h3>${label}</h3>${body}</div>`; }

function home() {
  return `<div class="wb-hero"><div><span class="wb-eyebrow">AI × TEACHING PRACTICE</span>
    <h2>让 AI 成为思考的助手，<br>不是教学的替身。</h2>
    <p>教学设计、课堂实训、作业评价、教学反思，串联完整的实践过程。关键判断由职前教师完成，系统保留过程与依据。</p>
    <button class="wb-btn wb-btn-light" data-page="design">开始教学设计 →</button></div>
    <div class="wb-hero-mark"><b>01</b><span>先独立构思<br>再审辨优化<br>最后复盘改进</span></div></div>
    <div class="wb-stat-row">
      <div><strong>${data.designs.length}</strong><span>设计迭代</span></div>
      <div><strong>${data.simulations.length + data.videos.length}</strong><span>课堂练习</span></div>
      <div><strong>${data.assignments.length}</strong><span>评价练习</span></div>
      <div><strong>${data.reflections.length}</strong><span>独立反思</span></div>
    </div><div class="wb-grid">
    ${card("教学设计审辨", "保留 AI 原稿和个人修改，检查学情、逻辑与价值导向。", "✎", "design", "备课")}
    ${card("课堂情景推演", "练习提问、插话和认知困惑的现场回应。", "◷", "simulate", "授课")}
    ${card("作业评价练习", "校验作业梯度，撰写有证据的个性化评语。", "▤", "assignment", "评价")}
    ${card("阶梯式教学反思", "串联实训证据，自主写出下一步行动。", "↗", "reflect", "复盘")}
    </div>`;
}
function design() {
  const history = data.designs.slice(0, 10).map((x) =>
    `<details class="wb-entry"><summary><strong>${h(x.topic)}</strong><span>${h(x.subject)} · ${h(x.type)} · ${h(x.date)}</span></summary>
      <p><b>学情依据：</b>${h(x.learners || "未填写")}</p>
      <p><b>外部 AI 内容（待审辨）：</b></p><pre>${h(x.ai || "无，独立设计")}</pre>
      <p><b>本人修改 / 原创：</b></p><pre>${h(x.revision)}</pre>
      <p><b>修改理由：</b>${h(x.reason || "未填写")}</p></details>`).join("");
  return `<div class="wb-two">
    ${panel("01 · 保存审辨过程", `<form data-form="design" class="wb-form">
      <div class="wb-form-row">${field("subject", "学科 *", "text", "如：小学语文")}${field("topic", "课题 *", "text", "如：荷叶圆圆")}</div>
      ${select("type", "材料类型", [["教案", "教案"], ["课件", "课件"], ["课后作业", "课后作业"], ["班会方案", "班会方案"]])}
      ${field("learners", "学情与班级情境", "textarea", "学生已有经验、差异及可能遇到的困难")}
      ${field("ai", "AI 生成内容 / 外部初稿（选填）", "textarea", "粘贴待审辨片段；请勿包含学生个人信息")}
      ${field("revision", "我的修改或原创方案 *", "textarea", "写下自己的教学目标、问题链或活动设计")}
      ${field("reason", "修改理由与核验依据", "textarea", "指出为何调整，以及如何核验学科事实")}
      <button class="wb-btn" type="submit">保存一个迭代版本</button></form>`,
      "版本以独立记录留存；不自动生成成品教案。")}
    ${panel("02 · 审辨清单", `<ul class="wb-check">
      <li><b>学情适配</b><span>活动是否匹配学生经验、学段和差异？</span></li>
      <li><b>学科逻辑</b><span>概念、例题和因果链是否经过教材核对？</span></li>
      <li><b>价值导向</b><span>德育或班会是否有真实情境，避免空泛口号？</span></li>
      <li><b>同质化</b><span>是否有可追溯的个人修改与具体教学证据？</span></li>
      <li><b>学科 AI 素养</b><span>可让学生比较 AI 答案与课本证据，说明核验理由。</span></li>
      </ul><p class="wb-note">以上是人工审辨提示，不是自动检测结果；本版本未接入 AI 语义校验。</p>`,
      "可用于教案、课件、作业与德育方案。")}</div>
    ${panel("版本留痕", history || placeholder("还没有设计记录。每次修改单独保存，便于对照。"))}`;
}
const scenarios = [
  ["课堂提问", "学生说：老师，为什么书上说的和我在网上看到的不一样？", "回应后，请追问：双方证据分别来自哪里？"],
  ["调皮插话", "一位学生打断同伴发言：这个太简单了，别讲了。", "回应后，请检查是否维护了同伴表达的权利。"],
  ["认知困惑", "三位学生在小组任务中反复把现象当成原因。", "回应后，请给出一条可验证的分步提示。"],
  ["课堂突发", "投影突然失灵，原定的视频导入无法播放。", "回应后，请想一个无需设备的等效活动。"]
];
function simulate() {
  const [name, prompt, tip] = scenarios[scenarioStep % scenarios.length];
  return `<div class="wb-two">
    ${panel("课前情景推演", `<div class="wb-scenario"><span>情境 ${scenarioStep % scenarios.length + 1} / ${scenarios.length} · ${name}</span>
      <p>“${prompt}”</p></div><form data-form="simulation" class="wb-form">
      ${field("response", "我的现场回应 *", "textarea", "用你在课堂上会说的话作答")}
      ${field("review", "我还可以怎样调整", "textarea", "考虑表达、追问和课堂秩序")}
      <button class="wb-btn" type="submit">保存回应并进入下一情境</button></form>
      <p class="wb-note">情境是预设脚本，不是真实 AI 学生；提示：${tip}</p>`)}
    ${panel("课堂视频观察记录", `<form data-form="video" class="wb-form">
      ${field("title", "视频或课次名称 *", "text", "如：微格课第 2 次")}
      ${field("time", "关键时点", "text", "如：02:18")}
      ${field("observation", "我观察到的课堂证据 *", "textarea", "学生反应、提问、候答时间或板书")}
      ${field("improvement", "下一次的改进动作", "textarea", "一条可验证的行动")}
      <button class="wb-btn" type="submit">保存人工观察</button></form>
      <p class="wb-note">视频文件请使用原有成长档案本机归档；当前未接入视频解析，不能自动定位片段或评分。</p>
      <button class="wb-btn wb-btn-outline" data-legacy="1">打开原有视频档案 →</button>`)}</div>
    ${panel("近期课堂练习", (data.simulations.slice(0, 3).map((x) =>
      `<div class="wb-entry"><strong>${h(x.scenario)}</strong><p>我的回应：${h(x.response)}</p><small>${h(x.date)}</small></div>`).join("") +
      data.videos.slice(0, 3).map((x) => `<div class="wb-entry"><strong>${h(x.title)} · ${h(x.time)}</strong><p>${h(x.observation)}</p><small>${h(x.date)}</small></div>`).join("")) || placeholder("尚无课堂练习记录。"))}`;
}
function assignment() {
  return `<div class="wb-two">
    ${panel("作业设计与批改练习", `<form data-form="assignment" class="wb-form">
      ${field("task", "作业目标与题目 *", "textarea", "写出学科、学段、基础题与进阶题")}
      ${field("student", "学生作答或表现摘要", "textarea", "请匿名化；勿录入学生真实姓名")}
      ${field("comment", "我的个性化评语 *", "textarea", "写出一条具体证据和一条可执行建议")}
      ${field("attachment", "可选文件（仅用于选择，不上传）", "file")}
      <button class="wb-btn" type="submit">保存评价练习</button></form>
      <p class="wb-note">图片、语音等文件当前不会被解析或保存；可在原有档案中单独归档授权材料。</p>`)}
    ${panel("评价自查", `<ul class="wb-check"><li><b>难度梯度</b><span>基础、迁移和拓展题是否有清晰区分？</span></li>
      <li><b>适配性</b><span>题目是否对齐目标，并为不同学生留出选择？</span></li>
      <li><b>评语证据</b><span>有没有指出这位学生的具体做法，而非套话？</span></li>
      <li><b>改进建议</b><span>学生下一步能否按评语独立行动？</span></li></ul>
      <p class="wb-note">这里提供的是自查清单，不会自动判定学生作业正确性。</p>`)}</div>
    ${panel("练习记录", data.assignments.slice(0, 8).map((x) =>
      `<details class="wb-entry"><summary><strong>${h(x.task).slice(0, 50)}</strong><span>${h(x.date)}</span></summary>
      <p>学生表现：${h(x.student || "未填写")}</p><p>我的评语：${h(x.comment)}</p></details>`).join("") || placeholder("还没有作业评价练习。"))}`;
}
function reflect() {
  return `<div class="wb-two">${panel("阶梯式反思", `<form data-form="reflection" class="wb-form">
    ${field("event", "第一步 · 发生了什么？*", "textarea", "用教案、课堂反应或作业反馈中的具体证据说明")}
    ${field("reason", "第二步 · 为什么会这样？*", "textarea", "提出至少一种原因，以及还需要核实什么")}
    ${field("action", "第三步 · 下次怎么改？*", "textarea", "写出可观察、可验证的教学调整")}
    <button class="wb-btn" type="submit">保存我的反思</button></form>
    <p class="wb-note">请独立完成关键判断。本地不能可靠识别文本是否由 AI 生成；不会据此判定违规。</p>`)}
    ${panel("从已有记录找线索", `<ul class="wb-check">
      <li><b>教学设计</b><span>最近 ${data.designs.length} 条：哪次修改真正回应了学情？</span></li>
      <li><b>课堂回应</b><span>最近 ${data.simulations.length + data.videos.length} 条：学生的证据是否改变了原计划？</span></li>
      <li><b>作业评价</b><span>最近 ${data.assignments.length} 条：哪些反馈能指导下一次练习？</span></li>
      </ul><p class="wb-note">以上只按记录数量引导回看，不会自动生成反思正文。</p>`)}</div>
    ${panel("反思日志", data.reflections.slice(0, 8).map((x) =>
      `<details class="wb-entry"><summary><strong>${h(x.event).slice(0, 52)}</strong><span>${h(x.date)}</span></summary>
      <p><b>原因：</b>${h(x.reason)}</p><p><b>下一步：</b>${h(x.action)}</p></details>`).join("") || placeholder("完成第一篇独立反思后，记录会显示在这里。"))}`;
}
function portfolio() {
  const counts = [
    ["设计与审辨", data.designs.length], ["课堂练习", data.simulations.length + data.videos.length],
    ["作业评价", data.assignments.length], ["教学反思", data.reflections.length]
  ];
  return `${panel("练习维度", `<div class="wb-bars">${counts.map(([label, count]) =>
    `<div><span>${label}</span><div class="wb-bar"><i style="width:${Math.min(100, count * 20)}%"></i></div><b>${count}</b></div>`).join("")}</div>
    <p class="wb-note">条数只代表练习覆盖，不是教学能力评分。原有雷达图基于本人手工录入评分，不是 AI 测评。</p>
    <button class="wb-btn" data-legacy="1">查看原有成长档案与视频 →</button>`)}
    ${panel("实训任务提交", `<form data-form="submission" class="wb-form">
      ${select("taskId", "选择任务", data.tasks.length ? data.tasks.map((x) => [x.id, x.title]) : [["", "暂无教师发布的任务"]])}
      ${field("student", "练习者标识 *", "text", "用编号或化名，避免真实姓名")}
      ${field("work", "提交摘要与独立工作说明 *", "textarea", "说明作品内容、AI 使用范围与本人修改")}
      <button class="wb-btn" type="submit" ${!data.tasks.length ? "disabled" : ""}>提交本机演示任务</button></form>
      <p class="wb-note">此处不支持多账号同步。真实学生提交与教师查看必须接入鉴权服务。</p>`)}`;
}
function boundary() {
  return `<div class="wb-grid wb-grid-three">
    ${panel("适合 AI 辅助", `<p>寻找备课切入点、生成不同设问供比较、整理非敏感材料、提示可能遗漏的检查项。</p>`)}
    ${panel("必须独立完成", `<p>判断学情、核实事实、决定教学目标、实施课堂互动、给学生个性化反馈、撰写真实反思。</p>`)}
    ${panel("使用前先确认", `<p>不输入学生隐私或未授权视频；检查内容版权与来源；公开使用时标明 AI 参与范围。</p>`)}</div>
    ${panel("典型陷阱 · 自查案例", `<div class="wb-entry"><strong>反面：直接复制“适用于所有学生”的教案</strong>
      <p>问题：缺少学段、先备知识和具体活动证据。修正：补充学情观察，重设问题链并记录修改理由。</p></div>
      <div class="wb-entry"><strong>正面：先写个人思路，再借助工具找替代设问</strong>
      <p>对照教材与学生回答筛选设问，最后由本人确定课堂方案，并在档案中保留取舍过程。</p></div>`)}`;
}
function tasks() {
  return `<div class="wb-two">${panel("发布实训任务", `<form class="wb-form" data-form="task">
    ${field("title", "任务名称 *", "text", "如：小学数学微格课设计")}
    ${field("requirement", "提交要求 *", "textarea", "明确任务目标和成果形式")}
    ${select("permission", "AI 使用约束", [["仅允许启发", "仅允许思路启发，独立写作"], ["允许审辨外部草稿", "允许审辨外部草稿，保留修改证据"], ["独立完成", "禁止使用 AI，独立完成"]])}
    <button class="wb-btn" type="submit">发布至本机演示任务</button></form>`)}
    ${panel("已发布任务", data.tasks.map((x) =>
      `<div class="wb-entry"><strong>${h(x.title)}</strong><span class="wb-tag">${h(x.permission)}</span>
      <p>${h(x.requirement)}</p><small>${h(x.date)}</small></div>`).join("") || placeholder("还没有发布任务。"))}</div>`;
}
function reviews() {
  return panel("待批阅提交", data.submissions.map((x) => {
    const task = data.tasks.find((t) => t.id === x.taskId);
    return `<div class="wb-entry"><strong>${h(task?.title || "已移除任务")} · ${h(x.student)}</strong>
      <p>${h(x.work)}</p><small>${h(x.date)} · ${h(task?.permission || "未知约束")}</small>
      <form class="wb-form wb-review" data-form="review" data-id="${h(x.id)}">
      ${field("feedback", "教师人工评语", "textarea", "从具体证据出发，指出可执行改进")}
      <button class="wb-btn" type="submit">保存人工指导</button></form>
      ${x.feedback ? `<p class="wb-feedback"><b>已保存评语：</b>${h(x.feedback)}</p>` : ""}</div>`;
  }).join("") || placeholder("暂无本机提交。AI 初筛与跨账号批阅尚未接入。"));
}
function statistics() {
  return `${panel("本机练习概览", `<div class="wb-stat-row">
    <div><strong>${data.tasks.length}</strong><span>发布任务</span></div>
    <div><strong>${data.submissions.length}</strong><span>收到提交</span></div>
    <div><strong>${data.submissions.filter((x) => x.feedback).length}</strong><span>人工批阅</span></div>
    <div><strong>${data.designs.length}</strong><span>设计版本</span></div></div>
    <button class="wb-btn" data-action="export">导出本机任务 CSV</button>
    <p class="wb-note">不能从本机数据推断班级高频问题或 AI 依赖程度；这些指标需要真实授权数据和人工复核。</p>`)}`;
}
function library() {
  return `${panel("审核通过的资源", data.resources.filter((x) => x.approved).map((x) =>
    `<div class="wb-entry"><strong>${h(x.title)}</strong>${tags([h(x.subject), h(x.type)])}
    <p>${h(x.description)}</p><small>来源：${h(x.source)} · 授权说明：${h(x.license)}</small></div>`).join("") ||
    placeholder("暂无通过审核的校内自有或已授权资源。请管理员核验来源后上架。"))}
    ${panel("资源使用原则", `<p>仅收录本校自有案例或明确取得使用许可的材料；展示条目不等于自动获取视频播放授权。学科素材、德育案例和使用示范需分别标注来源与适用情境。</p>`)}`;
}
function examples() {
  return `${panel("正面示范", `<div class="wb-entry"><strong>先独立构思，再验证 AI 提议</strong>
    <p>教师自行确定目标和学情，借助工具产生多个课堂设问，对照教材、课堂证据和价值导向筛选，记录取舍。</p></div>`)}
    ${panel("反面警示", `<div class="wb-entry"><strong>整段复制生成教案 / 反思</strong>
    <p>跳过学情分析，引用未经核实的学科事实，课堂后无法说清自己的教学决策。改进路径：保留原稿、标注错误、独立改写。</p></div>`)}`;
}
function users() {
  return `<div class="wb-two">${panel("制度规范", `<form class="wb-form" data-form="policy">
    ${field("policy", "本校 AI 实训管理准则（文本演示）", "textarea", "录入已发布制度的摘要，不填写敏感资料")}
    <button class="wb-btn" type="submit">保存本机制度摘要</button></form>
    <p class="wb-note">制度文件上传、账号管理和真实角色权限需要后端、认证与审计。</p>`)}
    ${panel("当前制度", data.policy ? `<p class="wb-entry">${h(data.policy)}</p>` : placeholder("尚未录入制度摘要。"))}</div>`;
}
function resourceAdmin() {
  return `<div class="wb-two">${panel("新增待审资源", `<form class="wb-form" data-form="resource">
    ${field("title", "案例名称 *", "text", "如：校内微格课案例")}
    <div class="wb-form-row">${field("subject", "学科 *")}${select("type", "资源类型", [["微格课", "微格课"], ["学科素材", "学科素材"], ["德育案例", "德育案例"], ["AI 使用示范", "AI 使用示范"]])}</div>
    ${field("source", "来源单位 / 提供者 *", "text", "如：本校教育实践中心")}
    ${field("license", "授权依据 *", "text", "如：校内授权编号及范围")}
    ${field("description", "内容简介 *", "textarea", "简述适用学段、教学亮点")}
    <button class="wb-btn" type="submit">加入待审列表</button></form>`)}
    ${panel("资源审核", data.resources.map((x) =>
      `<div class="wb-entry"><strong>${h(x.title)}</strong><span class="wb-tag">${x.approved ? "已上架" : "待审核"}</span>
      <p>${h(x.description)}</p><small>${h(x.source)} · ${h(x.license)}</small>
      <div class="wb-actions"><button class="wb-btn wb-btn-outline" data-action="toggle-resource" data-id="${h(x.id)}">${x.approved ? "下架资源" : "核验后上架"}</button></div></div>`).join("") ||
      placeholder("还没有资源条目。"))}</div>`;
}
function overview() {
  return `${panel("本机演示数据", `<div class="wb-stat-row">
    <div><strong>${data.tasks.length}</strong><span>任务</span></div>
    <div><strong>${data.submissions.length}</strong><span>提交</span></div>
    <div><strong>${data.resources.filter((x) => x.approved).length}</strong><span>已上架资源</span></div>
    <div><strong>${data.resources.filter((x) => !x.approved).length}</strong><span>待审核资源</span></div></div>
    <p class="wb-note">当前没有账号、跨设备同步或全校行为采集，不能产生真实院校层面的 AI 使用统计。</p>`)}`;
}
const pages = { home, design, simulate, assignment, reflect, portfolio, boundary, tasks, reviews, statistics, library, examples, users, "resource-admin": resourceAdmin, overview };
function render() {
  if (!nav[role].some(([name]) => name === page)) page = nav[role][0][0];
  const [title, subtitle] = titles[page];
  root.innerHTML = `<div class="wb-shell"><aside class="wb-sidebar">
    <div class="wb-brand"><span class="wb-brand-icon">砺</span><div><strong>砺教台</strong><small>教学实践实训平台</small></div></div>
    <div class="wb-side-label">四大功能模块</div>
    ${Object.keys(roleNames).map((item) => `<button class="wb-role ${role === item ? "is-active" : ""}" data-role="${item}" aria-pressed="${role === item}">
      ${roleNames[item]}<span>›</span></button>`).join("")}
    <div class="wb-side-label">当前模块</div>
    <nav aria-label="模块导航，可左右滑动">${nav[role].map(([name, label]) =>
      `<button class="wb-nav ${page === name ? "is-active" : ""}" data-page="${name}" ${page === name ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</nav>
    <div class="wb-side-foot">本机演示版<br>数据仅保存在当前浏览器<br>角色切换不代表账号权限</div></aside>
    <main class="wb-main"><header class="wb-top"><div><span class="wb-eyebrow">LIJIAO / ${h(roleNames[role])}</span>
      <h1>${title}</h1><p>${subtitle}</p></div><button class="wb-archive" data-legacy="1">原有成长档案 ↗</button></header>
      ${notice || storageError ? `<div class="wb-notice" role="status">${h(notice || "读取本机练习数据失败，已使用空白演示数据。")}</div>` : ""}
      <div class="wb-content">${pages[page]()}</div>
      <footer class="wb-footer">AI 辅助不替代独立判断 · 本机原型不提供真实 AI 诊断、视频解析或多用户权限</footer>
    </main></div>`;
}
root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-role], [data-page], [data-legacy], [data-action]");
  if (!button) return;
  if (button.dataset.role) { role = button.dataset.role; page = nav[role][0][0]; notice = ""; render(); }
  if (button.dataset.page) { page = button.dataset.page; notice = ""; render(); window.scrollTo(0, 0); }
  if (button.dataset.legacy) {
    root.hidden = true; original.hidden = false; legacyBack.hidden = false;
    window.scrollTo(0, 0);
  }
  if (button.dataset.action === "toggle-resource") {
    const resource = data.resources.find((x) => x.id === button.dataset.id);
    if (!resource) return;
    resource.approved = !resource.approved;
    if (!save()) resource.approved = !resource.approved;
    else notice = resource.approved ? "资源已上架，请确保授权依据已核验。" : "资源已下架。";
    render();
  }
  if (button.dataset.action === "export") {
    const csv = [["任务", "提交标识", "AI约束", "教师反馈", "日期"], ...data.submissions.map((x) => {
      const task = data.tasks.find((t) => t.id === x.taskId);
      return [task?.title || "", x.student, task?.permission || "", x.feedback || "", x.date];
    })].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "lijiao-local-report.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
legacyBack.addEventListener("click", () => {
  original.hidden = true; root.hidden = false; legacyBack.hidden = true;
  window.scrollTo(0, 0);
});
// Keep the legacy local archive, but route its external case links to the
// institution-only library. The minified legacy bundle still contains data.
original.addEventListener("click", (event) => {
  const link = event.target.closest('a[href*="bilibili.com"]');
  const button = event.target.closest("button");
  const oldResourceButton = button && (
    button.classList.contains("featured-resource") ||
    ["案例资源库", "资源库", "进入资源库"].includes(button.textContent.trim())
  );
  if (!link && !oldResourceButton) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  original.hidden = true;
  root.hidden = false;
  legacyBack.hidden = true;
  role = "resources";
  page = "library";
  notice = "旧版外部视频入口已停用，请使用经审核的校内资源库。";
  render();
  window.scrollTo(0, 0);
}, true);
root.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const input = Object.fromEntries([...new FormData(form)].filter(([key]) => key !== "attachment").map(([key, value]) => [key, String(value).trim()]));
  const required = {
    design: ["subject", "topic", "revision"], simulation: ["response"], video: ["title", "observation"],
    assignment: ["task", "comment"], reflection: ["event", "reason", "action"], task: ["title", "requirement"],
    submission: ["student", "work", "taskId"], resource: ["title", "subject", "source", "license", "description"]
  }[form.dataset.form] || [];
  if (required.some((name) => !input[name])) { setNotice("请填写所有标有 * 的必填内容。"); return; }
  if (form.dataset.form === "design") add("designs", input, "已保存教学设计迭代版本。");
  if (form.dataset.form === "simulation") {
    add("simulations", { ...input, scenario: scenarios[scenarioStep % scenarios.length][0] }, "已保存课堂回应。");
    scenarioStep++;
    render();
  }
  if (form.dataset.form === "video") add("videos", input, "已保存人工课堂观察。");
  if (form.dataset.form === "assignment") add("assignments", input, "已保存作业评价练习。");
  if (form.dataset.form === "reflection") add("reflections", input, "已保存独立反思。");
  if (form.dataset.form === "task") add("tasks", input, "任务已发布到本机演示列表。");
  if (form.dataset.form === "submission") {
    const task = data.tasks.find((x) => x.id === input.taskId);
    if (!task) { setNotice("任务不存在，请重新选择。"); return; }
    add("submissions", input, `提交已保存在本机。任务约束：${task.permission}。`);
  }
  if (form.dataset.form === "resource") add("resources", { ...input, approved: false }, "资源已加入待审核列表。");
  if (form.dataset.form === "review") {
    const submission = data.submissions.find((x) => x.id === form.dataset.id);
    if (!submission || !input.feedback) { setNotice("请填写教师评语。"); return; }
    const previous = submission.feedback;
    submission.feedback = input.feedback;
    if (!save()) submission.feedback = previous;
    else notice = "人工评语已保存。";
    render();
  }
  if (form.dataset.form === "policy") {
    const previous = data.policy;
    data.policy = input.policy;
    if (!save()) data.policy = previous;
    else notice = "本机制度摘要已更新。";
    render();
  }
});
original.hidden = true;
render();
