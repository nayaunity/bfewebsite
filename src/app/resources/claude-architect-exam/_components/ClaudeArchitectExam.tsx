"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSubscribe } from "@/hooks/useSubscribe";

interface DomainInfo {
  name: string;
  w: number;
  color: string;
  bg: string;
  text: string;
}

interface Scenario {
  id: number;
  title: string;
  ctx: string;
}

interface Question {
  id: number;
  scenario: number;
  domain: number;
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const EXAM_DURATION = 90 * 60;

const DOMAINS: Record<number, DomainInfo> = {
  1: { name: "Agentic Architecture & Orchestration", w: 0.27, color: "#7C3AED", bg: "#EDE9FE", text: "#5B21B6" },
  2: { name: "Tool Design & MCP Integration", w: 0.18, color: "#2563EB", bg: "#DBEAFE", text: "#1E40AF" },
  3: { name: "Claude Code Config & Workflows", w: 0.20, color: "#059669", bg: "#D1FAE5", text: "#065F46" },
  4: { name: "Prompt Engineering & Structured Output", w: 0.20, color: "#D97706", bg: "#FEF3C7", text: "#92400E" },
  5: { name: "Context Management & Reliability", w: 0.15, color: "#DC2626", bg: "#FEE2E2", text: "#991B1B" },
};

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Customer Support Resolution Agent",
    ctx: "You are building a customer support resolution agent using the Claude Agent SDK. The agent handles returns, billing disputes, and account issues via MCP tools: get_customer, lookup_order, process_refund, and escalate_to_human. Your target is 80%+ first-contact resolution while knowing when to escalate.",
  },
  {
    id: 2,
    title: "Code Generation with Claude Code",
    ctx: "You are using Claude Code to accelerate software development \u2014 code generation, refactoring, debugging, and documentation. You need to integrate it with custom slash commands, CLAUDE.md configurations, and choose between plan mode and direct execution.",
  },
  {
    id: 3,
    title: "Multi-Agent Research System",
    ctx: "You are building a multi-agent research system using the Claude Agent SDK. A coordinator delegates to specialized subagents: web search, document analysis, synthesis, and report generation. The system produces comprehensive cited reports.",
  },
  {
    id: 4,
    title: "Developer Productivity with Claude",
    ctx: "You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate, and automate repetitive tasks using built-in tools (Read, Write, Bash, Grep, Glob) and MCP servers.",
  },
  {
    id: 5,
    title: "Claude Code for CI/CD",
    ctx: "You are integrating Claude Code into your CI/CD pipeline. The system runs automated code reviews, generates test cases, and provides PR feedback. You need prompts that deliver actionable findings and minimize false positives.",
  },
  {
    id: 6,
    title: "Structured Data Extraction",
    ctx: "You are building a structured data extraction system using Claude. It extracts information from unstructured documents, validates output using JSON schemas, maintains high accuracy, handles edge cases gracefully, and integrates with downstream systems.",
  },
];

const QUESTIONS: Question[] = [
  // -- SCENARIO 1 --
  {
    id: 1, scenario: 1, domain: 1,
    q: "Your customer support agent\u2019s agentic loop sometimes stops after get_customer returns data and responds directly to the user \u2014 instead of proceeding to call lookup_order. What is the most likely cause?",
    options: [
      "The max_tokens parameter is too low, truncating the response before the model can issue another tool call.",
      "The loop control flow checks for assistant text content as a completion signal rather than inspecting stop_reason.",
      "The get_customer tool description overlaps with lookup_order, causing selection confusion after the first call.",
      "The system prompt lacks explicit instructions to call lookup_order after get_customer succeeds.",
    ],
    correct: 1,
    explanation: "Checking for assistant text content as a completion indicator is an explicitly listed anti-pattern. The correct pattern is: continue when stop_reason === 'tool_use', terminate only when stop_reason === 'end_turn'. Option A causes output truncation, not premature loop exit. Option C is a tool description issue unrelated to loop control flow. Option D relies on probabilistic prompt instructions for a deterministic control problem.",
  },
  {
    id: 2, scenario: 1, domain: 1,
    q: "A tool call interception hook is configured to block process_refund calls above $500 and redirect to escalate_to_human. A customer requests a $750 refund. Which statement correctly describes the system\u2019s behavior?",
    options: [
      "The hook intercepts, blocks, and deterministically redirects flow to escalate_to_human \u2014 guaranteeing refunds above $500 always reach a human agent.",
      "The hook intercepts the call but can only return an error; the agent must separately decide whether to escalate.",
      "The hook fires after process_refund executes and rolls back the transaction before triggering escalation.",
      "The hook dynamically removes process_refund from the tool list when the refund amount exceeds $500.",
    ],
    correct: 0,
    explanation: "Tool call interception hooks can block outgoing calls AND redirect to alternative workflows. The exam guide states hooks can \u2018block policy-violating actions (e.g., refunds exceeding $500) and redirect to alternative workflows (e.g., human escalation).\u2019 Option B is wrong \u2014 hooks can redirect, not just error. Option C describes PostToolUse (post-execution) behavior. Option D would require dynamic tool configuration, not a hook.",
  },
  {
    id: 3, scenario: 1, domain: 2,
    q: "Your MCP server exposes get_account_status (description: \u2018Gets account information\u2019) and get_subscription_details (description: \u2018Gets subscription information\u2019). In production the agent frequently calls the wrong tool. What is the root cause?",
    options: [
      "The agent\u2019s system prompt uses \u2018account\u2019 and \u2018subscription\u2019 interchangeably, creating unintended keyword associations.",
      "Both tools have minimal descriptions that don\u2019t explain input formats, outputs, or when to use each versus the other.",
      "The tools return overlapping data fields, so the model develops an incorrect model of each tool\u2019s purpose.",
      "The similar name suffixes (_status vs _details) cause the model to conflate the tools during selection.",
    ],
    correct: 1,
    explanation: "Minimal descriptions are the primary cause of tool selection unreliability. The guide states tool descriptions are \u2018the primary mechanism LLMs use for tool selection; minimal descriptions lead to unreliable selection among similar tools.\u2019 Option A is a secondary concern, not the root cause. Option C is implausible if tools return distinct data. Option D \u2014 name similarity is far less impactful than description quality.",
  },
  {
    id: 4, scenario: 1, domain: 5,
    q: "A support session has 12 accumulated lookup_order results in context \u2014 each returning 43 fields \u2014 but the issue only concerns return eligibility for one item. What is the best context management approach?",
    options: [
      "Use /compact to summarize the entire conversation before making any additional tool calls.",
      "Trim tool results to only return-relevant fields before they accumulate in context.",
      "Ask the customer to start a new conversation to reset the context window.",
      "Pass only the most recent tool result in each subsequent API request, discarding earlier results.",
    ],
    correct: 1,
    explanation: "\u2018Trimming verbose tool outputs to only relevant fields before they accumulate in context\u2019 is a key skill. When only 5 of 43 fields are relevant, extracting those prevents token waste. Option A (/compact) compresses the whole conversation, risking loss of precise transactional facts. Option C disrupts the customer experience. Option D breaks context coherence \u2014 the model needs conversation history to reason about the case.",
  },
  {
    id: 5, scenario: 1, domain: 5,
    q: "After several turns a customer says: \u2018This is ridiculous. I just want to talk to a real person.\u2019 How should the agent respond?",
    options: [
      "Acknowledge the frustration and attempt resolution one more time since the answer was already identified.",
      "Acknowledge the frustration and immediately escalate to a human agent without further investigation.",
      "Escalate only after an internal system confirms the issue cannot be resolved autonomously.",
      "Ask the customer to re-explain the issue to ensure nothing was missed before escalating.",
    ],
    correct: 1,
    explanation: "The guide is explicit: \u2018Honoring explicit customer requests for human agents immediately without first attempting investigation.\u2019 Option A violates the customer\u2019s stated preference by making another resolution attempt. Option C adds bureaucratic delay to an explicit human request. Option D forces the customer to repeat themselves \u2014 disrespectful of an explicit preference already stated.",
  },
  {
    id: 6, scenario: 1, domain: 1,
    q: "The coordinator receives: \u2018I have three issues: my last two orders never arrived, and I was charged twice for my subscription.\u2019 How should it handle this request?",
    options: [
      "Route the entire request to a single subagent that handles all three issues sequentially.",
      "Decompose the request into three distinct items, investigate each in parallel using shared context, then synthesize a unified resolution.",
      "Escalate to a human agent because multi-issue requests exceed the agent\u2019s designed scope.",
      "Address only the highest-priority issue and ask the customer to submit the others separately.",
    ],
    correct: 1,
    explanation: "The skill: \u2018Decomposing multi-concern customer requests into distinct items, then investigating each in parallel using shared context before synthesizing a unified resolution.\u2019 Option A loses the benefit of parallelism. Option C \u2014 multi-issue requests are not an escalation trigger; escalation is for policy gaps and inability to progress. Option D degrades the customer experience unnecessarily.",
  },
  {
    id: 7, scenario: 1, domain: 1,
    q: "An agentic loop uses this logic: \u2018Run for a maximum of 10 iterations, then terminate.\u2019 In production the agent frequently returns partial results after exactly 10 tool calls. What is the fundamental design flaw?",
    options: [
      "The cap of 10 is too low; it should be configurable per-task based on complexity.",
      "Using an arbitrary iteration cap as the primary stopping mechanism ignores the actual completion signal (stop_reason: \u2018end_turn\u2019), causing premature termination.",
      "The loop should check for assistant text content as a completion indicator instead of counting iterations.",
      "The engineer should use max_tokens to control loop length rather than an iteration counter.",
    ],
    correct: 1,
    explanation: "The guide lists \u2018setting arbitrary iteration caps as the primary stopping mechanism\u2019 as an explicit anti-pattern. Correct termination: stop_reason === \u2018end_turn\u2019. Any cap arbitrarily cuts off tasks that need more tool calls. Option A treats the symptom not the cause. Option C describes another listed anti-pattern. Option D confuses token limits with loop termination logic.",
  },
  {
    id: 8, scenario: 1, domain: 2,
    q: "Your MCP lookup_order tool returns {\"error\": \"Operation failed\"} when an order ID doesn\u2019t exist. The agent retries the same lookup three times before giving up. What should the error response include to prevent wasted retries?",
    options: [
      "A stack trace showing exactly where in the backend code the lookup failed.",
      "Structured metadata including errorCategory: \u2018validation\u2019, isRetryable: false, and a human-readable explanation that the order was not found.",
      "A 404 HTTP status code instead of 500 to signal the type of failure.",
      "The original query parameters so the agent can try alternative search terms.",
    ],
    correct: 1,
    explanation: "The guide specifies \u2018returning structured metadata including errorCategory, isRetryable boolean\u2019 to \u2018prevent wasted retry attempts.\u2019 A not-found order is definitively non-retryable. Option A leaks implementation details. Option C \u2014 MCP doesn\u2019t use HTTP status codes this way. Option D \u2014 different search terms won\u2019t find a non-existent order.",
  },
  {
    id: 9, scenario: 1, domain: 1,
    q: "Your agent needs to escalate a billing dispute to a human agent who has no access to the AI conversation transcript. What should the structured handoff include?",
    options: [
      "A link to the conversation transcript stored in a shared database.",
      "A request for the customer to re-explain the issue to the human agent.",
      "A structured handoff summary including customer ID, order details, root cause analysis, amounts in dispute, and recommended action.",
      "The agent\u2019s internal confidence score and a chronological list of every tool called.",
    ],
    correct: 2,
    explanation: "The guide: \u2018Compiling structured handoff summaries (customer ID, root cause, refund amount, recommended action) when escalating to human agents who lack access to the conversation transcript.\u2019 Option A assumes a shared database exists. Option B forces the customer to repeat themselves. Option D \u2014 confidence scores and tool logs are internal details that don\u2019t help human agents resolve customer issues.",
  },
  {
    id: 10, scenario: 1, domain: 1,
    q: "Three MCP tools return timestamps in incompatible formats: Unix epoch integers (CRM), ISO 8601 strings (order system), and \u2018Month DD YYYY\u2019 text (legacy billing). The agent makes date comparison errors. What is the most robust fix?",
    options: [
      "Update each MCP tool\u2019s implementation to standardize date output to ISO 8601.",
      "Implement a PostToolUse hook that normalizes all tool result timestamps to ISO 8601 before the model processes them.",
      "Add system prompt instructions: \u2018Convert all dates to ISO 8601 format before making any date comparisons.\u2019",
      "Create a separate normalization subagent that preprocesses all tool output before passing it to the main agent.",
    ],
    correct: 1,
    explanation: "\u2018Implementing PostToolUse hooks to normalize heterogeneous data formats (Unix timestamps, ISO 8601, numeric status codes) from different MCP tools before the agent processes them.\u2019 Hooks provide deterministic normalization before the model sees the data. Option A requires modifying potentially third-party tools. Option C relies on the model correctly performing normalization \u2014 probabilistic. Option D over-engineers with an extra agent for a hook-sized problem.",
  },
  {
    id: 11, scenario: 1, domain: 5,
    q: "The agent calls get_customer using only a customer\u2019s last name and receives three matching records. How should the agent proceed?",
    options: [
      "Select the record with the highest account balance \u2014 most likely the customer disputing a charge.",
      "Select the most recently created account \u2014 most likely the active customer.",
      "Ask the customer for additional identifying information (email, phone number, or order number) to disambiguate.",
      "Escalate to a human agent since the ambiguity cannot be resolved algorithmically.",
    ],
    correct: 2,
    explanation: "\u2018Multiple customer matches require clarification (requesting additional identifiers) rather than heuristic selection.\u2019 Any heuristic risks operating on the wrong account. Options A and B are the heuristic approaches the guide explicitly prohibits. Option D escalates unnecessarily when a simple clarifying question resolves the ambiguity.",
  },
  // -- SCENARIO 2 --
  {
    id: 12, scenario: 2, domain: 3,
    q: "A new engineer reports Claude Code isn\u2019t following the team\u2019s async/await error-handling conventions. These rules exist only in a senior engineer\u2019s ~/.claude/CLAUDE.md. What is the correct fix?",
    options: [
      "Have the new engineer manually copy the ~/.claude/CLAUDE.md to their own home directory.",
      "Move the conventions to a project-level CLAUDE.md (.claude/CLAUDE.md or root CLAUDE.md) and commit to version control.",
      "Use @import in the new engineer\u2019s ~/.claude/CLAUDE.md to reference the senior engineer\u2019s file from a shared network path.",
      "Add the conventions to a CLAUDE.md in each subdirectory where the async/await patterns are used.",
    ],
    correct: 1,
    explanation: "\u2018User-level settings apply only to that user \u2014 instructions in ~/.claude/CLAUDE.md are not shared with teammates via version control.\u2019 Project-level CLAUDE.md files are version-controlled and automatically shared. Option A requires manual action per developer. Option C creates a fragile shared network dependency. Option D creates redundant duplication that\u2019s harder to maintain.",
  },
  {
    id: 13, scenario: 2, domain: 3,
    q: "Your /analyze-dependencies skill reads the entire dependency tree and produces a 3,000-word analysis. After invoking it, subsequent Claude interactions become slower and less focused. Which SKILL.md frontmatter option resolves this?",
    options: [
      "allowed-tools: [Read, Glob] to restrict which tools the skill can access",
      "context: fork to run the skill in an isolated sub-agent context that doesn\u2019t pollute the main session",
      "argument-hint: \u2018path to package.json\u2019 to prompt for required input",
      "max-output: compact to automatically summarize the skill\u2019s verbose output",
    ],
    correct: 1,
    explanation: "\u2018The context: fork frontmatter option for running skills in an isolated sub-agent context, preventing skill outputs from polluting the main conversation.\u2019 The guide explicitly cites context: fork to \u2018isolate skills that produce verbose output (e.g., codebase analysis).\u2019 Option A restricts tool access but doesn\u2019t prevent output from filling main context. Option C adds an input prompt with no effect on verbosity. Option D is not a valid SKILL.md frontmatter option.",
  },
  {
    id: 14, scenario: 2, domain: 3,
    q: "A developer asks Claude Code to fix a null pointer exception. The stack trace clearly identifies the file (UserService.java, line 247) and the missing null check. Which mode should they use?",
    options: [
      "Plan mode, to ensure the null check doesn\u2019t introduce regressions in methods that call getUserById().",
      "Direct execution, because this is a well-scoped single-file change with a clear stack trace.",
      "Plan mode with the Explore subagent, to fully map the class hierarchy before making changes.",
      "Direct execution followed by fork_session to test alternative implementations safely.",
    ],
    correct: 1,
    explanation: "\u2018Direct execution is appropriate for simple, well-scoped changes\u2019 \u2014 and \u2018a single-file bug fix with a clear stack trace\u2019 is a canonical example in the guide. Plan mode\u2019s overhead provides no value here. Option A over-engineers a trivial, clearly scoped change. Option C adds further unnecessary overhead. Option D adds session forking complexity with no benefit for a straightforward fix.",
  },
  {
    id: 15, scenario: 2, domain: 3,
    q: "Your monorepo has Terraform in infra/ and React in src/. Test files are co-located throughout src/ (e.g., Button.test.tsx next to Button.tsx). All conventions are in one giant root CLAUDE.md. What is the most maintainable approach?",
    options: [
      "Split conventions into separate root-level files (CLAUDE-react.md, CLAUDE-terraform.md).",
      "Create .claude/rules/ files with YAML frontmatter glob patterns (e.g., paths: [\u2018infra/**/*\u2019] and paths: [\u2018**/*.test.tsx\u2019]) for each convention set.",
      "Place a CLAUDE.md in infra/ for Terraform conventions and another in src/ for React conventions.",
      "Use @import in the root CLAUDE.md to always import all convention files simultaneously.",
    ],
    correct: 1,
    explanation: "\u2018.claude/rules/ files with YAML frontmatter paths fields containing glob patterns for conditional rule activation\u2019 load only when editing matching files. The glob **/*.test.tsx applies testing conventions to all test files regardless of directory \u2014 something directory-level CLAUDE.md files cannot do. Option A is invalid \u2014 only one CLAUDE.md per directory level. Option C can\u2019t handle cross-directory file types. Option D always loads all conventions, wasting tokens.",
  },
  {
    id: 16, scenario: 2, domain: 3,
    q: "A developer describes: \u2018Convert customer names from Last, First format to First Last format.\u2019 Scripts work for simple names but fail for \u2018Smith Jr., John\u2019 and \u2018Garc\u00eda-L\u00f3pez, Ana\u2019. What\u2019s the most effective next step?",
    options: [
      "Rewrite the prompt with more comprehensive natural language rules covering each edge case.",
      "Provide 2-3 concrete input/output examples: {input: \u2018Smith Jr., John\u2019, output: \u2018John Smith Jr.\u2019} and {input: \u2018Garc\u00eda-L\u00f3pez, Ana\u2019, output: \u2018Ana Garc\u00eda-L\u00f3pez\u2019}.",
      "Use the interview pattern \u2014 ask Claude to identify all edge cases before attempting another implementation.",
      "Share the full production dataset so Claude has complete context about all name formats.",
    ],
    correct: 1,
    explanation: "\u2018Concrete input/output examples as the most effective way to communicate expected transformations when prose descriptions are interpreted inconsistently.\u2019 When natural language produces inconsistent results, exact input/output pairs directly encode the requirements. Option A applies the same approach that\u2019s already failing. Option C is most useful before initial implementation, not during edge case debugging. Option D provides too much data without focusing on the specific parsing rules.",
  },
  {
    id: 17, scenario: 2, domain: 3,
    q: "You want a custom /security-audit command that runs a checklist on the current file, available to all developers when they clone the repository. Where should this command file be created?",
    options: [
      "In .claude/commands/ in the project repository root",
      "In ~/.claude/commands/ on each developer\u2019s local machine",
      "Defined inside the project\u2019s root CLAUDE.md file under a \u2018commands\u2019 section",
      "In .claude/skills/ with a SKILL.md including argument-hint for the target file",
    ],
    correct: 0,
    explanation: "\u2018Project-scoped commands in .claude/commands/ (shared via version control) vs user-scoped commands in ~/.claude/commands/ (personal).\u2019 Commands in .claude/commands/ are version-controlled and available to all team members automatically. Option B requires manual configuration per developer. Option C \u2014 CLAUDE.md does not define slash commands. Option D \u2014 skills are for complex multi-step workflows, not simple slash commands.",
  },
  {
    id: 18, scenario: 2, domain: 3,
    q: "Your team always needs JSDoc on exported TypeScript functions (enforced for all code generation), and engineers occasionally want to run a comprehensive dependency vulnerability scan. Which configuration is correct?",
    options: [
      "Put both in .claude/commands/ as slash commands requiring explicit invocation each time.",
      "Put the JSDoc requirement in CLAUDE.md (always-loaded) and the vulnerability scan as a skill in .claude/skills/ (on-demand invocation).",
      "Put both requirements in CLAUDE.md \u2014 one as a rule, one as an optional workflow description.",
      "Put both in .claude/skills/ \u2014 the mandatory one auto-runs, the optional one is manually invoked.",
    ],
    correct: 1,
    explanation: "\u2018Choosing between skills (on-demand invocation for task-specific workflows) and CLAUDE.md (always-loaded universal standards).\u2019 Enforced standards belong in CLAUDE.md for automatic application; optional workflows belong as on-demand skills. Option A \u2014 JSDoc must be explicitly requested each time, losing automatic enforcement. Option C \u2014 vulnerability scan instructions always load unnecessarily. Option D \u2014 SKILL.md has no auto-run mechanism.",
  },
  {
    id: 19, scenario: 2, domain: 3,
    q: "Your monorepo\u2019s root CLAUDE.md has grown to 4,000 lines covering React, Python, API design, database standards, infrastructure, and CI/CD guidelines. Engineers report Claude Code sometimes ignores conventions. What is the best remediation?",
    options: [
      "Split into multiple root-level CLAUDE.md files (CLAUDE-react.md, CLAUDE-python.md, etc.).",
      "Use @import for modular topic-specific files combined with .claude/rules/ for path-scoped conventions that load only when relevant.",
      "Move all conventions to an internal wiki and create a slash command to fetch the relevant section on demand.",
      "Trim the CLAUDE.md to the 600 most important lines to stay within an effective attention window.",
    ],
    correct: 1,
    explanation: "\u2018The @import syntax for referencing external files to keep CLAUDE.md modular\u2019 and \u2018.claude/rules/ for organizing topic-specific rule files.\u2019 The modular approach maintains complete conventions with selective loading. Option A is invalid \u2014 only one CLAUDE.md per directory level. Option C makes enforcement dependent on manual retrieval. Option D arbitrarily discards conventions.",
  },
  // -- SCENARIO 3 --
  {
    id: 20, scenario: 3, domain: 1,
    q: "Your coordinator needs to simultaneously launch the web search subagent and the document analysis subagent to minimize research latency. How do you achieve parallel execution?",
    options: [
      "Make two sequential Task tool calls in separate coordinator turns, one after the other.",
      "Emit two Task tool calls in a single coordinator response so both subagents launch simultaneously.",
      "Configure the coordinator\u2019s AgentDefinition with a parallelism: 2 setting to enable concurrent spawning.",
      "Use fork_session twice from the coordinator to create two independent exploration branches.",
    ],
    correct: 1,
    explanation: "\u2018Spawning parallel subagents by emitting multiple Task tool calls in a single coordinator response rather than across separate turns.\u2019 Multiple Task calls in one response launch in parallel. Option A forces serial execution. Option C describes a non-existent AgentDefinition configuration. Option D \u2014 fork_session creates divergent exploration branches, not parallel coordinated subagent execution.",
  },
  {
    id: 21, scenario: 3, domain: 1,
    q: "Your research coordinator always routes queries through the full pipeline: web search \u2192 document analysis \u2192 synthesis \u2192 report generation. For a simple factual question like \u2018What year was the GDPR enacted?\u2019 this takes 45 seconds. What design improvement addresses this?",
    options: [
      "Reduce timeout values for each subagent to force faster completion across all query types.",
      "Configure the coordinator to analyze each query\u2019s requirements and dynamically select which subagents to invoke rather than always running the full pipeline.",
      "Add a caching layer that stores prior research results and returns them for similar queries.",
      "Increase the coordinator\u2019s max_tokens so it can reason about routing more efficiently.",
    ],
    correct: 1,
    explanation: "\u2018Designing coordinator agents that analyze query requirements and dynamically select which subagents to invoke rather than always routing through the full pipeline.\u2019 Simple factual queries don\u2019t need the full research pipeline. Option A would cause failures on legitimate complex queries. Option C is a complementary optimization, not the core architectural fix. Option D \u2014 max_tokens has no bearing on pipeline routing decisions.",
  },
  {
    id: 22, scenario: 3, domain: 1,
    q: "The coordinator just ran the web search subagent, which retrieved 15 relevant articles. Now the document analysis subagent needs to examine them. How should the findings be passed?",
    options: [
      "Store the web search results in a shared database and pass the database key to the analysis subagent.",
      "Include the complete web search findings directly in the document analysis subagent\u2019s prompt.",
      "Pass a brief 3-sentence summary of key findings to minimize the subagent\u2019s context size.",
      "The document analysis subagent inherits the coordinator\u2019s conversation history automatically, including the search results.",
    ],
    correct: 1,
    explanation: "\u2018Subagent context must be explicitly provided in the prompt \u2014 subagents do not automatically inherit parent context or share memory between invocations\u2019 and \u2018Including complete findings from prior agents directly in the subagent\u2019s prompt.\u2019 The analysis agent needs the full results for meaningful analysis. Option A adds external dependencies. Option C may lose important detail needed for analysis. Option D is explicitly false \u2014 subagents operate with isolated context.",
  },
  {
    id: 23, scenario: 3, domain: 1,
    q: "Your research report on \u2018AI impact on the economy\u2019 covers only labor market effects, missing capital allocation, monetary policy, and productivity growth. The coordinator\u2019s logs show it decomposed the topic into: \u2018AI and job displacement,\u2019 \u2018AI and unemployment rates,\u2019 and \u2018AI and workforce reskilling.\u2019 What is the root cause?",
    options: [
      "The synthesis agent lacks instructions for identifying and reporting coverage gaps in received findings.",
      "The coordinator\u2019s task decomposition is too narrow, assigning subtasks that cover only a subset of the broad topic.",
      "The web search subagent\u2019s queries are insufficiently broad and need expanded search terms.",
      "The document analysis subagent applies overly restrictive relevance criteria, filtering out non-labor-market sources.",
    ],
    correct: 1,
    explanation: "The coordinator\u2019s own logs reveal the root cause: it decomposed \u2018AI impact on the economy\u2019 into only labor market subtasks, omitting capital allocation, monetary policy, and productivity growth. This is exactly \u2018Risks of overly narrow task decomposition by the coordinator, leading to incomplete coverage of broad research topics.\u2019 The subagents performed correctly within their assigned scope. Options A, C, and D incorrectly blame downstream agents.",
  },
  {
    id: 24, scenario: 3, domain: 2,
    q: "Your synthesis subagent has access to 18 tools including web_search, translate_text, fetch_url, extract_entities, and 14 others. It frequently attempts web searches while synthesizing findings instead of integrating provided research. What is the most direct fix?",
    options: [
      "Add system prompt instructions: \u2018You are a synthesis agent. Do not perform web searches or fetch external URLs.\u2019",
      "Restrict the synthesis subagent\u2019s tool access to only synthesis-relevant tools (extract_entities, create_citation, format_output), removing web search entirely.",
      "Update the web_search tool description to clarify it should only be invoked by the web search subagent.",
      "Implement a hook that intercepts web_search calls from the synthesis agent and routes them to the web search subagent.",
    ],
    correct: 1,
    explanation: "\u2018Restricting each subagent\u2019s tool set to those relevant to its role, preventing cross-specialization misuse\u2019 and \u2018giving an agent access to too many tools (e.g., 18 instead of 4-5) degrades tool selection reliability.\u2019 Removing the tool eliminates misuse entirely. Option A uses probabilistic prompt compliance. Option C improves descriptions but doesn\u2019t remove access to the misused tool. Option D adds a hook to redirect calls from a tool the agent shouldn\u2019t have had in the first place.",
  },
  {
    id: 25, scenario: 3, domain: 5,
    q: "The document analysis subagent is processing three documents when one URL returns HTTP 404. How should the subagent handle this to best enable coordinator recovery?",
    options: [
      "Terminate immediately and propagate the error to the coordinator so it can restart the full research pipeline.",
      "Return an empty result set marked as successful to avoid disrupting the coordinator\u2019s workflow.",
      "Analyze the two available documents, return structured results annotated with a coverage gap noting the unavailable document.",
      "Implement automatic retries with exponential backoff, then return a generic \u2018document_unavailable\u2019 status after all retries.",
    ],
    correct: 2,
    explanation: "\u2018Having subagents implement local recovery for transient failures and only propagate errors they cannot resolve\u2019 and \u2018Structuring synthesis output with coverage annotations indicating which findings are well-supported versus which topic areas have gaps.\u2019 A 404 is definitively unavailable \u2014 not transient. The subagent proceeds with partial results and communicates the gap. Option A terminates the workflow unnecessarily. Option B hides the coverage gap. Option D retries a 404 which will never succeed.",
  },
  {
    id: 26, scenario: 3, domain: 5,
    q: "Two credible sources report conflicting statistics: Source A reports 38% enterprise AI adoption in 2023; Source B reports 52% for the same period. How should the synthesis agent handle this conflict?",
    options: [
      "Average the two values (45%) to present a balanced composite estimate.",
      "Select the more recent source\u2019s value, which is likely based on more current data.",
      "Present both values with source attributions, explicitly annotating the conflict rather than arbitrarily selecting or averaging.",
      "Flag the conflict to the coordinator for resolution before including any statistic in the synthesis.",
    ],
    correct: 2,
    explanation: "\u2018How to handle conflicting statistics from credible sources: annotating conflicts with source attribution rather than arbitrarily selecting one value.\u2019 The synthesis agent preserves the conflict for downstream review. Options A and B produce aggregations or selections that lose the conflict information. Option D adds unnecessary latency \u2014 the synthesis agent should handle this pattern autonomously by presenting both values with attribution.",
  },
  // -- SCENARIO 4 --
  {
    id: 27, scenario: 4, domain: 2,
    q: "An engineer asks Claude Code to find all places in a large codebase where the validatePayment() function is called. Which built-in tool should be used?",
    options: [
      "Glob, with the pattern **/*.{js,ts} to locate all JavaScript and TypeScript source files",
      "Read, to load each source file individually and scan its contents for the function name",
      "Grep, to search file contents across the codebase for the pattern \u2018validatePayment\u2019",
      "Bash, to run a custom find command piped through grep for content matching",
    ],
    correct: 2,
    explanation: "\u2018Grep for content search (searching file contents for patterns like function names, error messages, or import statements)\u2019 \u2014 finding all callers of a function is exactly Grep\u2019s use case. Option A (Glob) finds files by path/name pattern, not content. Option B (Read) would require loading every file individually \u2014 very inefficient. Option D (Bash) could work but is less idiomatic than the purpose-built Grep tool.",
  },
  {
    id: 28, scenario: 4, domain: 2,
    q: "Claude Code needs to change only the third occurrence of `retry_interval = 1000` in a config file where this exact string appears 9 times. What is the correct approach?",
    options: [
      "Use Edit with the text \u2018retry_interval = 1000\u2019 as the anchor \u2014 Edit will prompt to choose which occurrence.",
      "Edit will fail because the anchor text is non-unique; fall back to Read + Write to make the targeted replacement precisely.",
      "Use Grep to identify all line numbers, then use Edit with additional surrounding context to uniquely identify the third occurrence.",
      "Use Bash with a sed command for line-number-precise substitution.",
    ],
    correct: 1,
    explanation: "\u2018When Edit fails due to non-unique text matches, using Read + Write as a fallback for reliable file modifications.\u2019 Edit requires unique anchor text \u2014 with 9 identical occurrences it fails. The correct fallback: Read the full file, make the targeted change, Write it back. Option A is wrong \u2014 Edit does not prompt for ambiguous matches; it fails. Option C could work but adds complexity. Option D bypasses Claude\u2019s idiomatic tooling pattern.",
  },
  {
    id: 29, scenario: 4, domain: 2,
    q: "Your team uses Jira for issue tracking. A developer suggests building a custom MCP server for Jira integration to \u2018perfectly fit our workflow.\u2019 What is the recommended approach?",
    options: [
      "Build a custom MCP server to ensure maximum control over how Jira data is presented to Claude.",
      "Use an existing community Jira MCP server for standard operations, reserving custom servers only for workflows not covered by community tools.",
      "Avoid MCP integration for Jira entirely \u2014 use Claude Code\u2019s built-in Bash tool to call the Jira REST API directly.",
      "Build a custom server because community MCP servers cannot be configured in project-scoped .mcp.json files.",
    ],
    correct: 1,
    explanation: "\u2018Choosing existing community MCP servers over custom implementations for standard integrations (e.g., Jira), reserving custom servers for team-specific workflows.\u2019 Community servers solve the standard integration problem without development effort. Option A over-engineers a solved problem. Option C works but loses the structured tool interface benefits of MCP. Option D is incorrect \u2014 community servers can be configured in project-level .mcp.json.",
  },
  {
    id: 30, scenario: 4, domain: 1,
    q: "You\u2019ve been using a Claude Code session named \u2018payment-refactor\u2019 for 4 days. This morning a teammate merged a significant rewrite of PaymentGateway.java\u2019s error handling. How should you proceed?",
    options: [
      "Resume with --resume payment-refactor and trust that Claude will detect file changes automatically.",
      "Resume with --resume payment-refactor and explicitly inform Claude that PaymentGateway.java has been significantly rewritten, describing what changed.",
      "Start an entirely new session since the file changes invalidate all prior analysis.",
      "Use fork_session before resuming to preserve the original analysis before informing Claude of the changes.",
    ],
    correct: 1,
    explanation: "\u2018The importance of informing the agent about changes to previously analyzed files when resuming sessions after code modifications.\u2019 The prior analysis of other files remains valid \u2014 only PaymentGateway.java changed. Targeted re-analysis is more efficient than full re-exploration. Option A \u2014 Claude doesn\u2019t automatically detect file system changes in resumed sessions. Option C discards valid prior context. Option D adds unnecessary session overhead.",
  },
  {
    id: 31, scenario: 4, domain: 1,
    q: "After thoroughly analyzing a legacy codebase, you want to compare two architectural approaches: event-driven architecture versus CQRS. Each has significant implications. What is the most efficient approach?",
    options: [
      "Start two new sessions from scratch, re-analyzing the codebase independently for each approach.",
      "Use fork_session from your analysis session to create two independent branches, one for each architectural approach.",
      "Explore both approaches sequentially in the current session, alternating as needed.",
      "Use plan mode to design both approaches simultaneously, then choose one for direct execution.",
    ],
    correct: 1,
    explanation: "\u2018fork_session for creating independent branches from a shared analysis baseline to explore divergent approaches.\u2019 Forking preserves the completed analysis while enabling clean, independent exploration of each option. Option A wastes time re-analyzing the codebase from scratch. Option C creates context mixing between two approaches. Option D uses plan mode but doesn\u2019t create independent exploration paths for each approach.",
  },
  {
    id: 32, scenario: 4, domain: 2,
    q: "Your team needs a GitHub MCP server accessible to all project developers with credentials managed via environment variables. You also have a personal experimental MCP server with unreleased features. Where should each be configured?",
    options: [
      "Both in project-level .mcp.json, using different permission levels to restrict the personal server.",
      "The GitHub MCP server in project-scoped .mcp.json with ${GITHUB_TOKEN} expansion; your personal server in user-scoped ~/.claude.json.",
      "Both in ~/.claude.json on each developer\u2019s machine, manually configured per person.",
      "The GitHub server in ~/.claude.json for flexibility; the personal server in a separate branch\u2019s .mcp.json for isolation.",
    ],
    correct: 1,
    explanation: "\u2018MCP server scoping: project-level (.mcp.json) for shared team tooling vs user-level (~/.claude.json) for personal/experimental servers\u2019 and \u2018Environment variable expansion in .mcp.json (e.g., ${GITHUB_TOKEN}) for credential management without committing secrets.\u2019 Option A puts the personal server in the shared project config, exposing it to the team. Option C requires manual configuration per developer. Option D puts the team tool in personal config, requiring setup on every machine.",
  },
  // -- SCENARIO 5 --
  {
    id: 33, scenario: 5, domain: 4,
    q: "Your CI review prompt is: \u2018Review this code for quality issues.\u2019 Developers dismiss 80% of findings, especially around code comment accuracy. How should you improve the prompt to reduce false positives in the comment category?",
    options: [
      "Add: \u2018Only report issues you are highly confident about. Be conservative.\u2019",
      "Add: \u2018Be thorough but focus only on the most impactful 3-5 issues per review.\u2019",
      "Replace with explicit criteria: \u2018Flag comments only when the claimed behavior directly contradicts the actual code behavior. Skip comments that are incomplete, outdated, or stylistically inconsistent but not factually wrong.\u2019",
      "Add: \u2018Apply a high confidence threshold. Only flag findings where you are 90%+ certain an issue exists.\u2019",
    ],
    correct: 2,
    explanation: "\u2018The importance of explicit criteria over vague instructions\u2019 and \u2018How general instructions like be conservative or only report high-confidence findings fail to improve precision.\u2019 Specific categorical criteria about what to flag vs. skip directly calibrate the model\u2019s judgment. Options A, B, and D all use the confidence-based filtering language the guide explicitly identifies as ineffective \u2014 they don\u2019t define what actually constitutes a real issue.",
  },
  {
    id: 34, scenario: 5, domain: 4,
    q: "Your CI test generation consistently produces tests that cover the happy path but miss branch-level conditions like null returns, empty collections, and exception paths. What is the most effective fix?",
    options: [
      "Expand the system prompt with detailed natural language instructions describing what branch coverage means.",
      "Increase max_tokens to allow the model to generate more tests per function.",
      "Add 2-4 few-shot examples demonstrating tests that cover both the happy path and specific branch conditions: null returns, empty inputs, and error states.",
      "Switch from unit test generation to integration test generation, which naturally exercises more code paths.",
    ],
    correct: 2,
    explanation: "\u2018Few-shot examples as the most effective technique for achieving consistently formatted, actionable output when detailed instructions alone produce inconsistent results\u2019 and \u2018the role of few-shot examples in demonstrating ambiguous-case handling (e.g., branch-level test coverage gaps).\u2019 Concrete examples showing adequate branch coverage teach the generalization. Option A is the approach already failing. Option B addresses length, not reasoning quality. Option D changes test type rather than improving coverage depth.",
  },
  {
    id: 35, scenario: 5, domain: 4,
    q: "Your team generates code using Claude in one session, then reviews it using a separate session. A developer suggests: \u2018Generate and review in one session to save costs.\u2019 Why should you maintain separate sessions?",
    options: [
      "A combined session would exceed the context window when processing large files and tests.",
      "The same Claude session retains reasoning context from generation, making it systematically less effective at identifying flaws in decisions it just made.",
      "Claude\u2019s available tools change after code generation completes, limiting the review\u2019s thoroughness.",
      "Cost savings from a combined session are offset by increased API response latency.",
    ],
    correct: 1,
    explanation: "\u2018Self-review limitations: a model retains reasoning context from generation, making it less likely to question its own decisions in the same session\u2019 and \u2018Independent review instances (without prior reasoning context) are more effective at catching subtle issues.\u2019 The generator\u2019s reasoning anchors its review. Option A is a real concern but not the primary architectural reason. Option C \u2014 tool access is consistent within a session. Option D \u2014 combined sessions don\u2019t inherently add latency.",
  },
  {
    id: 36, scenario: 5, domain: 3,
    q: "Your CI pipeline script runs: claude \"Review this pull request for security vulnerabilities\" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What is the correct fix?",
    options: [
      "Add the -p flag: claude -p \"Review this pull request for security vulnerabilities\"",
      "Set the environment variable CLAUDE_NONINTERACTIVE=true before running the command",
      "Redirect stdin: claude \"Review this pull request for security vulnerabilities\" < /dev/null",
      "Add the --ci flag: claude --ci \"Review this pull request for security vulnerabilities\"",
    ],
    correct: 0,
    explanation: "\u2018The -p (or --print) flag for running Claude Code in non-interactive mode in automated pipelines.\u2019 The -p flag processes the prompt, outputs to stdout, and exits without waiting for input. Options B, C, and D reference non-existent features \u2014 CLAUDE_NONINTERACTIVE is not a valid environment variable, --ci is not a valid flag, and stdin redirection doesn\u2019t properly address Claude Code\u2019s interactive mode mechanism.",
  },
  {
    id: 37, scenario: 5, domain: 3,
    q: "Your CI pipeline needs to automatically parse review findings and post them as inline PR comments with file locations and line numbers. How should you configure Claude Code output?",
    options: [
      "Parse the plain text output with regex patterns to extract filenames, line numbers, and issue descriptions.",
      "Add to the prompt: \u2018Format your findings as JSON with fields: file, line, severity, description.\u2019",
      "Use --output-format json combined with --json-schema defining fields like file, line, severity, and finding for machine-parseable output.",
      "Pipe the Claude Code output through a second Claude API call to convert text findings into structured JSON.",
    ],
    correct: 2,
    explanation: "\u2018--output-format json and --json-schema CLI flags for enforcing structured output in CI contexts\u2019 produce schema-compliant JSON directly parseable by CI tooling. Option A (regex) is brittle and breaks with output format variations. Option B (prompt-instructed JSON) is probabilistic \u2014 the model may deviate on edge cases. Option D adds latency and cost for a conversion the CLI flags handle natively.",
  },
  {
    id: 38, scenario: 5, domain: 4,
    q: "Currently: (1) a blocking pre-merge quality check developers wait on, and (2) a nightly technical debt report reviewed the next morning \u2014 both use real-time API calls. Your manager proposes switching both to the Message Batches API for 50% savings. How do you evaluate this?",
    options: [
      "Switch both to Message Batches API \u2014 50% savings on both workflows justifies the change.",
      "Switch only the nightly technical debt report to batch; keep real-time calls for the blocking pre-merge check.",
      "Keep real-time calls for both to avoid the complexity of polling for batch completion.",
      "Switch both to batch with a 30-minute polling interval to check for early completion.",
    ],
    correct: 1,
    explanation: "\u2018Batch processing is appropriate for non-blocking, latency-tolerant workloads (overnight reports) and inappropriate for blocking workflows (pre-merge checks).\u2019 The Message Batches API has up to 24-hour processing time with no guaranteed SLA \u2014 unacceptable for developers blocked waiting to merge. The nightly report has overnight tolerance, making it ideal for batch. Option A applies batch to the blocking check. Option C wastes cost savings. Option D makes a blocking workflow dependent on unreliable batch timing.",
  },
  // -- SCENARIO 6 --
  {
    id: 39, scenario: 6, domain: 4,
    q: "Your document extraction system sometimes returns valid JSON, sometimes wraps it in markdown code fences, and occasionally returns a text explanation instead of structured data. What is the most reliable approach to guarantee schema-compliant output?",
    options: [
      "Add to the system prompt: \u2018Always respond with raw JSON only. Never use markdown formatting or prose explanations.\u2019",
      "Use tool_use with a JSON schema defining the extraction structure, and set tool_choice to \u2018any\u2019 to guarantee the model calls an extraction tool.",
      "Post-process all responses with a parser that strips markdown fences and extracts any JSON object found in the text.",
      "Request JSON output in the user message and validate with a regex pattern before passing to downstream systems.",
    ],
    correct: 1,
    explanation: "\u2018Tool use (tool_use) with JSON schemas as the most reliable approach for guaranteed schema-compliant structured output, eliminating JSON syntax errors\u2019 and \u2018Setting tool_choice: any to guarantee the model calls a tool rather than returning conversational text.\u2019 tool_choice: \u2018any\u2019 forces a tool call on every turn, and the schema enforces structure. Options A and D are probabilistic prompt instructions. Option C fails when the model returns prose with no JSON present.",
  },
  {
    id: 40, scenario: 6, domain: 4,
    q: "Your extraction schema has document_type as an enum: [\u2018invoice\u2019, \u2018contract\u2019, \u2018receipt\u2019, \u2018purchase_order\u2019]. You encounter medical billing statements, property deeds, and employment agreements not fitting any category. What schema pattern handles this most gracefully?",
    options: [
      "Add every possible document type to the enum to be exhaustive.",
      "Remove the enum and use a free-text string field to accept any document type description.",
      "Add \u2018other\u2019 to the enum values paired with an optional document_type_detail string field for non-standard types.",
      "Mark the document_type field as nullable so the model returns null for unrecognized types.",
    ],
    correct: 2,
    explanation: "\u2018Schema design considerations: enum fields with other + detail string patterns for extensible categories.\u2019 This provides type safety for known categories while gracefully handling novel types through the detail field. Option A requires frequent schema updates as new types emerge. Option B loses the categorization benefits of enums. Option D loses all type information for non-standard documents, preventing downstream routing.",
  },
  {
    id: 41, scenario: 6, domain: 4,
    q: "Invoice extraction validation shows 20% of invoices have line_items_total that doesn\u2019t match invoice_total. Investigation reveals: 12% are legitimate source document arithmetic errors (vendor mistakes), and 8% are extraction errors where subtotal values landed in the total field. What is the correct handling strategy?",
    options: [
      "Retry all 20% with error feedback \u2014 retries may produce correct results for all cases.",
      "Retry only the 8% with field placement errors using specific validation feedback. Accept the 12% source arithmetic errors as correct extractions, flagged with a conflict indicator.",
      "Retry all 20% with increased temperature to encourage different extraction strategies.",
      "Route all 20% to human review without attempting automated retry.",
    ],
    correct: 1,
    explanation: "\u2018The limits of retry: retries are ineffective when the required information is simply absent from the source document (vs format or structural errors).\u2019 For the 12% with actual vendor arithmetic errors \u2014 retrying won\u2019t fix the source document. Only the 8% with structural field placement errors benefit from retry with specific error feedback. Option A wastes retry calls on unfixable cases. Option C changes temperature but not the field placement issue. Option D skips correctable errors unnecessarily.",
  },
  {
    id: 42, scenario: 6, domain: 5,
    q: "Your extraction system reports 95% overall accuracy across 8,000 documents. Leadership wants to reduce human review from 100% to 15%. What must you validate before reducing review coverage?",
    options: [
      "Run the system on 2,000 additional documents to tighten the confidence interval of the 95% figure.",
      "Analyze accuracy by document type and field segment to verify consistent 95% performance across all categories before reducing review.",
      "Implement field-level confidence scoring, then reduce review only for extractions where confidence exceeds 90%.",
      "Establish a stratified random sampling process at 10% of high-confidence extractions for ongoing monitoring.",
    ],
    correct: 1,
    explanation: "\u2018The risk that aggregate accuracy metrics (e.g., 97% overall) may mask poor performance on specific document types or fields\u2019 and \u2018The importance of validating accuracy by document type and field segment before automating high-confidence extractions.\u2019 A 95% aggregate could hide 50% accuracy on a specific category. Segmented validation is the prerequisite. Options C and D are valuable monitoring strategies but are not the prerequisite validation step required before reducing review.",
  },
  {
    id: 43, scenario: 6, domain: 4,
    q: "Your system returns null for 25% of academic papers that clearly contain dates. Investigation reveals those papers express dates informally: \u2018Submitted: Autumn 2022\u2019, \u2018Accepted: Q2 2023\u2019, \u2018Published: Early 2024\u2019. What is the most effective fix?",
    options: [
      "Add a comprehensive list of all informal date format patterns to the system prompt.",
      "Change the publication_date field to required (non-nullable) to force the model to always extract a value.",
      "Add few-shot examples demonstrating correct extraction from informal date formats, showing the input text and expected structured output.",
      "Build a post-processing step that sends null dates back through a separate Claude API call focused on date extraction.",
    ],
    correct: 2,
    explanation: "\u2018The effectiveness of few-shot examples for reducing hallucination in extraction tasks (e.g., handling informal measurements, varied document structures)\u2019 and \u2018Adding few-shot examples showing correct extraction from documents with varied formats to address empty/null extraction of required fields.\u2019 Examples showing how to map informal expressions to structured dates teach the generalization. Option A is incomplete. Option B causes hallucinated dates for truly date-absent documents. Option D adds latency and cost a well-prompted single call can handle.",
  },
  {
    id: 44, scenario: 6, domain: 4,
    q: "An extracted invoice has subtotal: 850.00 and total_with_tax: 820.00 \u2014 semantically impossible since a tax-inclusive total cannot be less than the subtotal. Pydantic validation catches this. What is the best retry strategy?",
    options: [
      "Re-run the extraction with the identical prompt \u2014 a different result may emerge on retry.",
      "Include the failed extraction and the specific validation error (\u2018total_with_tax of 820.00 is less than subtotal of 850.00 \u2014 these fields appear to be swapped\u2019) in a follow-up request for model self-correction.",
      "Make both fields required in the schema to prevent the model from omitting either value.",
      "Implement a post-processing rule that automatically swaps the values when total_with_tax < subtotal.",
    ],
    correct: 1,
    explanation: "\u2018Retry-with-error-feedback: appending specific validation errors to the prompt on retry to guide the model toward correction\u2019 and \u2018Implementing follow-up requests that include the original document, the failed extraction, and specific validation errors for model self-correction.\u2019 Option A (blind retry) provides no correction signal. Option C prevents omission but not value swapping. Option D silently modifies extracted data without verification \u2014 dangerous for financial records.",
  },
  {
    id: 45, scenario: 6, domain: 4,
    q: "Your extraction pipeline handles invoices, contracts, and receipts \u2014 each with a different JSON schema. With tool_choice: \u2018auto\u2019, the model returns a text explanation instead of calling any tool in 12% of requests. How should you fix this?",
    options: [
      "Change tool_choice from \u2018auto\u2019 to \u2018any\u2019 to guarantee the model always calls one of the extraction tools.",
      "Add system prompt instructions: \u2018Always call an extraction tool. Never respond with explanatory text.\u2019",
      "Use tool_choice: {type: \u2018tool\u2019, name: \u2018extract_invoice\u2019} to force a specific extraction schema.",
      "Consolidate the three extraction tools into one generic tool to simplify the model\u2019s selection decision.",
    ],
    correct: 0,
    explanation: "\u2018Setting tool_choice: any to guarantee the model calls a tool rather than returning conversational text\u2019 and \u2018The distinction between tool_choice: auto (model may return text instead of calling a tool), any (model must call a tool but can choose which).\u2019 With unknown document type, \u2018any\u2019 ensures a tool is always called while allowing the model to select the appropriate schema. Option B is probabilistic prompt compliance. Option C forces a specific tool when the document type is unknown. Option D degrades extraction quality by forcing all types through one schema.",
  },
  {
    id: 46, scenario: 6, domain: 5,
    q: "After 3 hours of processing contracts, the model begins applying terms from Contract #50 to Contract #280 \u2014 attributing the wrong payment schedule to the wrong document. What is the most likely cause and recommended fix?",
    options: [
      "Model temperature has increased due to session length. Reset the temperature parameter to 0.",
      "Context degradation in extended sessions causes earlier document content to bleed into later extractions. Use /compact or spawn per-document subagents to isolate each extraction\u2019s context.",
      "Documents 50 and 280 have sufficiently similar contract structures that the model is correctly generalizing between them.",
      "The JSON extraction schema is too flexible, causing the model to fill optional fields with plausible content from other documents.",
    ],
    correct: 1,
    explanation: "\u2018Context degradation in extended sessions: models start giving inconsistent answers and referencing typical patterns rather than specific classes discovered earlier.\u2019 Long accumulation of document content causes inappropriate cross-document bleeding. /compact reduces context usage; per-document subagents isolate each document\u2019s context entirely. Option A \u2014 temperature is a fixed parameter, not a session variable. Option C is implausible given the explicit cross-document bleeding symptom. Option D \u2014 schema flexibility doesn\u2019t cause context bleed.",
  },
  {
    id: 47, scenario: 6, domain: 2,
    q: "You need to guarantee that extract_document_metadata runs before extract_financial_data or extract_parties in your extraction pipeline. How should you enforce this ordering at the API level?",
    options: [
      "Add system prompt instructions: \u2018Always call extract_document_metadata first. Never call other extraction tools without running metadata extraction first.\u2019",
      "Use tool_choice: {type: \u2018tool\u2019, name: \u2018extract_document_metadata\u2019} in the first API call to force metadata extraction, then allow subsequent tools in follow-up turns.",
      "Configure extract_financial_data and extract_parties to check for metadata in their input and return an error if missing.",
      "Set tool_choice: \u2018any\u2019 on the first call \u2014 the model will reason correctly about which tool to call first.",
    ],
    correct: 1,
    explanation: "\u2018Using tool_choice forced selection to ensure a specific tool is called first (e.g., forcing extract_metadata before enrichment tools), then processing subsequent steps in follow-up turns.\u2019 Forced tool selection provides a deterministic guarantee. Option A relies on probabilistic prompt compliance \u2014 the guide is clear that prompt instructions alone have a non-zero failure rate for deterministic ordering. Option C creates runtime errors rather than preventing the problem. Option D leaves ordering entirely to the model\u2019s discretion.",
  },
  {
    id: 48, scenario: 6, domain: 5,
    q: "Your research synthesis pipeline loses source attribution when the synthesis agent combines findings from multiple analysis subagents. The final report makes claims without linking them to their original sources. What is the root cause and fix?",
    options: [
      "The synthesis agent\u2019s context window is too small to retain all source URLs alongside the findings.",
      "Source attribution is lost during summarization steps when findings are compressed without preserving claim-source mappings. Require subagents to output structured claim-source mappings that the synthesis agent must preserve through synthesis.",
      "The synthesis agent needs more detailed prompt instructions to \u2018include citations in the final report.\u2019",
      "The web search subagent needs to output citations in a format the synthesis agent can recognize.",
    ],
    correct: 1,
    explanation: "\u2018How source attribution is lost during summarization steps when findings are compressed without preserving claim-source mappings\u2019 and \u2018Requiring subagents to output structured claim-source mappings (source URLs, document names, relevant excerpts) that downstream agents preserve through synthesis.\u2019 The structural solution is requiring subagents to output claim-source mappings as structured data. Option A misattributes the problem to context size. Option C uses vague prompt instructions. Option D addresses only the web search subagent.",
  },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface DomainStatsEntry {
  correct: number;
  total: number;
}

function calcScore(answers: Record<number, number>) {
  const domainStats: Record<number, DomainStatsEntry> = {};
  for (let d = 1; d <= 5; d++) domainStats[d] = { correct: 0, total: 0 };
  QUESTIONS.forEach((q) => {
    domainStats[q.domain].total++;
    if (answers[q.id] === q.correct) domainStats[q.domain].correct++;
  });
  let weighted = 0;
  for (let d = 1; d <= 5; d++) {
    const ds = domainStats[d];
    const pct = ds.total > 0 ? ds.correct / ds.total : 0;
    weighted += DOMAINS[d].w * pct;
  }
  const scaled = Math.round(100 + weighted * 900);
  return { scaled, pass: scaled >= 720, domainStats };
}

const SCENARIO_QUESTIONS = SCENARIOS.map((s) =>
  QUESTIONS.filter((q) => q.scenario === s.id)
);

export default function ClaudeArchitectExam() {
  const [hasAccess, setHasAccess] = useState(false);
  const [gateEmail, setGateEmail] = useState("");
  const { status } = useSession();
  const { isLoading: isSubmitting, error: subscribeError, subscribe } = useSubscribe();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      setHasAccess(true);
    } else {
      const unlocked = localStorage.getItem("bfe-course-access");
      setHasAccess(unlocked === "true");
    }
  }, [status]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateEmail) return;
    await subscribe(gateEmail, {
      tags: ["bfewebsite", "claude-architect-exam"],
      onSuccess: () => {
        localStorage.setItem("bfe-course-access", "true");
        localStorage.setItem("bfe-user-email", gateEmail);
        setHasAccess(true);
        setPhase("exam");
      },
    });
  };

  const [phase, setPhase] = useState<"intro" | "gate" | "exam" | "results">("intro");
  const [scenIdx, setScenIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showCtx, setShowCtx] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "flagged">("all");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScen = SCENARIOS[scenIdx];
  const currentQList = SCENARIO_QUESTIONS[scenIdx];
  const currentQ = currentQList[qIdx];
  const totalAnswered = Object.keys(answers).length;
  const globalIdx =
    SCENARIO_QUESTIONS.slice(0, scenIdx).reduce((a, b) => a + b.length, 0) +
    qIdx;

  useEffect(() => {
    if (phase === "exam") {
      timerRef.current = setInterval(() => {
        setTimeLeft((p) => {
          if (p <= 1) {
            clearInterval(timerRef.current!);
            setPhase("results");
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const submitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("results");
  };

  const selectAnswer = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const n = new Set(prev);
      if (n.has(currentQ.id)) n.delete(currentQ.id);
      else n.add(currentQ.id);
      return n;
    });
  };

  const goNext = () => {
    if (qIdx < currentQList.length - 1) {
      setQIdx(qIdx + 1);
    } else if (scenIdx < SCENARIOS.length - 1) {
      setScenIdx(scenIdx + 1);
      setQIdx(0);
    }
  };

  const goPrev = () => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
    } else if (scenIdx > 0) {
      setScenIdx(scenIdx - 1);
      setQIdx(SCENARIO_QUESTIONS[scenIdx - 1].length - 1);
    }
  };

  const isLast =
    scenIdx === SCENARIOS.length - 1 && qIdx === currentQList.length - 1;
  const isFirst = scenIdx === 0 && qIdx === 0;
  const timerColor =
    timeLeft < 600 ? "text-red-600" : timeLeft < 1800 ? "text-amber-600" : "text-emerald-600";

  const handleBeginExam = () => {
    if (hasAccess) {
      setPhase("exam");
    } else {
      setPhase("gate");
    }
  };

  // -- INTRO --
  if (phase === "intro") {
    return (
      <div className="p-8 max-w-[720px] mx-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] text-[var(--foreground)]">
        <div className="border-b border-[var(--card-border)] pb-6 mb-6">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#ef562a] flex items-center justify-center text-white text-[15px] font-semibold">
              C
            </div>
            <span className="text-[11px] text-[var(--gray-600)] tracking-wider uppercase font-medium">
              Anthropic &middot; Community Mock Exam
            </span>
          </div>
          <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
            Claude Certified Architect &mdash; Foundations
          </h2>
          <p className="text-sm text-[var(--gray-600)]">
            Full-length practice exam &middot; 48 questions &middot; 90 minutes
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {([
            ["48", "Questions"],
            ["90 min", "Time limit"],
            ["720", "Passing score"],
            ["6", "Scenarios"],
          ] as const).map(([v, l]) => (
            <div key={l} className="bg-[var(--gray-50)] rounded-lg py-3.5 px-2.5 text-center">
              <div className="text-xl font-semibold text-[var(--foreground)]">{v}</div>
              <div className="text-[11px] text-[var(--gray-600)] mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--foreground)] mb-2.5 uppercase tracking-wide">
            Domain weights
          </p>
          {Object.entries(DOMAINS).map(([id, d]) => (
            <div key={id} className="flex items-center gap-2.5 mb-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <div className="text-[13px] text-[var(--gray-600)] flex-1">
                Domain {id}: {d.name}
              </div>
              <div className="text-[13px] font-semibold min-w-[32px] text-right" style={{ color: d.color }}>
                {Math.round(d.w * 100)}%
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--accent-yellow-bg)] border border-[var(--accent-yellow-text)]/30 rounded-lg px-3.5 py-3 mb-6 text-xs text-[var(--accent-yellow-text)] leading-relaxed">
          <strong>Note:</strong> The real exam presents 4 of 6 scenarios
          randomly. This mock exam includes all 6 for maximum preparation
          coverage. Unanswered questions count as incorrect &mdash; no penalty for
          guessing.
        </div>

        <button
          onClick={handleBeginExam}
          className="w-full py-3.5 bg-[#ef562a] hover:bg-[#d94d24] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors"
        >
          Begin Exam
        </button>
      </div>
    );
  }

  // -- EMAIL GATE --
  if (phase === "gate") {
    return (
      <div className="p-8 max-w-[720px] mx-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] text-[var(--foreground)] text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#ffe500] flex items-center justify-center">
          <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl md:text-3xl mb-3">
          Enter your email to begin
        </h2>
        <p className="text-[var(--gray-600)] mb-8 max-w-md mx-auto">
          Unlock the full 48-question practice exam. No spam, ever.
        </p>
        <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={gateEmail}
            onChange={(e) => setGateEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
            className="flex-1 px-5 py-4 border border-[var(--card-border)] rounded-full bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[#ef562a] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#ef562a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d94d25] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Get Access"}
          </button>
        </form>
        {subscribeError && (
          <p className="text-sm text-red-600 mt-3">{subscribeError}</p>
        )}
        <p className="text-xs text-[var(--gray-600)] mt-4">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  // -- RESULTS --
  if (phase === "results") {
    const { scaled, pass, domainStats } = calcScore(answers);
    const correct = QUESTIONS.filter((q) => answers[q.id] === q.correct).length;
    const filteredQs =
      reviewFilter === "all"
        ? QUESTIONS
        : reviewFilter === "wrong"
        ? QUESTIONS.filter((q) => answers[q.id] !== q.correct)
        : QUESTIONS.filter((q) => flagged.has(q.id));

    return (
      <div className="p-6 max-w-[760px] mx-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] text-[var(--foreground)]">
        {/* Score card */}
        <div className={`rounded-xl p-8 text-center mb-6 border ${pass ? "bg-[var(--accent-green-bg)] border-[var(--accent-green-text)]/30" : "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800"}`}>
          <div className={`text-[11px] tracking-widest uppercase font-semibold mb-1.5 ${pass ? "text-[var(--accent-green-text)]" : "text-red-700 dark:text-red-400"}`}>
            {pass ? "\u2713 Passing score" : "\u2717 Below passing threshold"}
          </div>
          <div className={`text-7xl font-bold leading-none ${pass ? "text-[var(--accent-green-text)]" : "text-red-600 dark:text-red-400"}`}>
            {scaled}
          </div>
          <div className="text-[13px] text-[var(--gray-600)] mt-1.5">
            {correct} of {QUESTIONS.length} correct (
            {Math.round((correct / QUESTIONS.length) * 100)}%) &middot; Minimum
            passing: 720
          </div>
        </div>

        {/* Domain breakdown */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">
            Domain breakdown
          </p>
          {Object.entries(DOMAINS).map(([id, d]) => {
            const ds = domainStats[Number(id)];
            const pct = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
            const barColor = pct >= 72 ? d.color : "#DC2626";
            return (
              <div key={id} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--gray-600)]">{d.name}</span>
                  <span className="text-xs font-semibold" style={{ color: barColor }}>
                    {ds.correct}/{ds.total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--gray-200)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: pct + "%", background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Review section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide m-0">
              Review questions
            </p>
            <div className="flex gap-1.5">
              {(["all", "wrong", "flagged"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setReviewFilter(f); setShowReview(true); }}
                  className={`text-[11px] px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                    reviewFilter === f && showReview
                      ? "border-[#ef562a] bg-[#ef562a]/10 text-[#ef562a] font-semibold"
                      : "border-[var(--card-border)] bg-transparent text-[var(--gray-600)]"
                  }`}
                >
                  {f === "all" ? `All (${QUESTIONS.length})` : f === "wrong" ? `Missed (${QUESTIONS.filter(q => answers[q.id] !== q.correct).length})` : `Flagged (${flagged.size})`}
                </button>
              ))}
            </div>
          </div>

          {showReview && filteredQs.map((q) => {
            const ua = answers[q.id];
            const isCorrect = ua === q.correct;
            return (
              <div
                key={q.id}
                className="border border-[var(--card-border)] rounded-lg p-3.5 mb-2.5"
                style={{ borderLeftWidth: "3px", borderLeftColor: isCorrect ? "#16A34A" : ua === undefined ? "#9CA3AF" : "#DC2626" }}
              >
                <div className="flex gap-1.5 mb-2 flex-wrap items-center">
                  <span className="text-[11px] px-2 py-0.5 rounded font-semibold" style={{ background: DOMAINS[q.domain].bg, color: DOMAINS[q.domain].text }}>
                    D{q.domain}
                  </span>
                  <span className="text-[11px] text-[var(--gray-600)]">
                    Scenario {q.scenario} &middot; Q{q.id}
                  </span>
                  {flagged.has(q.id) && (
                    <span className="text-[11px] text-amber-600">&#x2691; flagged</span>
                  )}
                  {ua === undefined && (
                    <span className="text-[11px] text-[var(--gray-600)]">not answered</span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-[var(--foreground)] mb-2.5 leading-relaxed">
                  {q.q}
                </p>
                {q.options.map((opt, i) => {
                  const isC = i === q.correct;
                  const isU = i === ua;
                  const optClass = isC
                    ? "bg-[var(--accent-green-bg)] border-[var(--accent-green-text)]/40 text-[var(--accent-green-text)]"
                    : isU && !isC
                    ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                    : "bg-transparent border-[var(--card-border)] text-[var(--gray-600)]";
                  return (
                    <div key={i} className={`py-1.5 px-2.5 rounded-md mb-1 border text-xs flex gap-2 items-start ${optClass}`}>
                      <span className="font-bold min-w-[14px] shrink-0">{String.fromCharCode(65 + i)}</span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
                <div className="mt-2.5 p-2.5 bg-[var(--gray-50)] rounded-md text-xs text-[var(--gray-600)] leading-relaxed">
                  <strong className="text-[var(--foreground)]">Explanation: </strong>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -- EXAM --
  const progress = globalIdx + 1;
  return (
    <div className="max-w-[800px] mx-auto pb-8 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] text-[var(--foreground)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-2.5 flex items-center gap-3 rounded-t-2xl">
        <div className="flex-1">
          <div className="text-[11px] text-[var(--gray-600)] mb-1">
            Q{progress} of {QUESTIONS.length} &middot; {totalAnswered} answered
          </div>
          <div className="h-1 rounded-full bg-[var(--gray-200)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ef562a] transition-all duration-200"
              style={{ width: (progress / QUESTIONS.length) * 100 + "%" }}
            />
          </div>
        </div>
        <div className={`text-[17px] font-bold tabular-nums min-w-[52px] text-right ${timerColor}`}>
          {formatTime(timeLeft)}
        </div>
        <button
          onClick={submitExam}
          className="text-xs px-3 py-1.5 rounded-md border border-red-500 text-red-500 bg-transparent cursor-pointer font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          Submit
        </button>
      </div>

      <div className="px-6 pt-4">
        {/* Scenario tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2.5">
          {SCENARIOS.map((sc, i) => {
            const done = SCENARIO_QUESTIONS[i].filter(
              (q) => answers[q.id] !== undefined
            ).length;
            const total = SCENARIO_QUESTIONS[i].length;
            const active = i === scenIdx;
            return (
              <button
                key={i}
                onClick={() => { setScenIdx(i); setQIdx(0); }}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                  active
                    ? "border-[#ef562a] bg-[#ef562a]/10 text-[#ef562a] font-semibold"
                    : "border-[var(--card-border)] bg-transparent text-[var(--gray-600)]"
                }`}
              >
                S{i + 1} {done === total ? "\u2713" : `${done}/${total}`}
              </button>
            );
          })}
        </div>

        {/* Scenario context */}
        <div className="border border-[var(--card-border)] rounded-lg p-3 mb-3 text-xs text-[var(--gray-600)] leading-relaxed">
          <div className="flex justify-between items-center" style={{ marginBottom: showCtx ? "6px" : 0 }}>
            <span className="font-semibold text-[var(--foreground)] text-xs">
              Scenario {currentScen.id}: {currentScen.title}
            </span>
            <button
              onClick={() => setShowCtx(!showCtx)}
              className="text-[11px] border-none bg-transparent cursor-pointer text-[var(--gray-600)] p-0 hover:text-[#ef562a] transition-colors"
            >
              {showCtx ? "hide" : "show context"}
            </button>
          </div>
          {showCtx && <span>{currentScen.ctx}</span>}
        </div>

        {/* Question card */}
        <div className="border border-[var(--card-border)] rounded-xl p-5 mb-3">
          {/* Domain badge + flag */}
          <div className="flex gap-2 mb-3 items-center">
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold" style={{ background: DOMAINS[currentQ.domain].bg, color: DOMAINS[currentQ.domain].text }}>
              Domain {currentQ.domain}
            </span>
            <span className="text-[11px] text-[var(--gray-600)]">
              {DOMAINS[currentQ.domain].name}
            </span>
            <button
              onClick={toggleFlag}
              className={`ml-auto text-[11px] border-none bg-transparent cursor-pointer p-0 transition-colors ${
                flagged.has(currentQ.id) ? "text-amber-600 font-semibold" : "text-[var(--gray-600)]"
              }`}
            >
              {flagged.has(currentQ.id) ? "\u2691 flagged" : "\u2690 flag"}
            </button>
          </div>

          {/* Question text */}
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4 font-medium">
            {currentQ.q}
          </p>

          {/* Answer options */}
          {currentQ.options.map((opt, i) => {
            const selected = answers[currentQ.id] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left py-2.5 px-3.5 rounded-lg mb-1.5 cursor-pointer text-[13px] flex gap-2.5 items-start leading-normal border transition-colors ${
                  selected
                    ? "border-[#ef562a] bg-[#ef562a]/10 text-[#ef562a]"
                    : "border-[var(--card-border)] bg-transparent text-[var(--foreground)] hover:border-[var(--gray-600)]"
                }`}
              >
                <span className={`font-bold min-w-[16px] shrink-0 ${selected ? "text-[#ef562a]" : "text-[var(--gray-600)]"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Q navigator (current scenario) */}
        <div className="flex gap-1 flex-wrap mb-3">
          {currentQList.map((q, i) => {
            const done = answers[q.id] !== undefined;
            const isCurrent = i === qIdx;
            const isFlag = flagged.has(q.id);
            return (
              <button
                key={i}
                onClick={() => setQIdx(i)}
                className={`w-7 h-7 rounded text-[11px] cursor-pointer border transition-colors ${
                  isCurrent
                    ? "bg-[#ef562a] border-[#ef562a] text-white font-bold"
                    : isFlag
                    ? "bg-[var(--accent-yellow-bg)] border-amber-500 text-[var(--accent-yellow-text)] font-medium"
                    : done
                    ? "bg-[var(--accent-green-bg)] border-[var(--accent-green-text)]/30 text-[var(--accent-green-text)] font-medium"
                    : "bg-transparent border-[var(--card-border)] text-[var(--gray-600)]"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Prev / Next */}
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`flex-1 py-2.5 rounded-lg border border-[var(--card-border)] bg-transparent text-[13px] font-medium transition-colors ${
              isFirst ? "text-[var(--gray-200)] cursor-not-allowed" : "text-[var(--foreground)] cursor-pointer hover:border-[var(--gray-600)]"
            }`}
          >
            &larr; Previous
          </button>
          {isLast ? (
            <button
              onClick={submitExam}
              className="flex-1 py-2.5 rounded-lg border-none bg-[#ef562a] hover:bg-[#d94d24] text-white cursor-pointer text-[13px] font-semibold transition-colors"
            >
              Submit exam
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex-1 py-2.5 rounded-lg border border-[var(--card-border)] bg-transparent text-[var(--foreground)] cursor-pointer text-[13px] font-medium hover:border-[var(--gray-600)] transition-colors"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
