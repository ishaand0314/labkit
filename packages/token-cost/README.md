# @labkit/token-cost

**One command to see what the same prompt costs — token count and USD — across OpenAI, Anthropic, and Google.**

```text
$ token-cost estimate "Summarize this quarterly earnings report and flag the three biggest risks." --output 400

Input: 74 chars, output assumption: 400 tok

Model                   In tok  Out tok      Total
─────────────────────────────────────────────────────────────
Gemini 3.1 Flash-Lite      19*      400   $0.00060  ← cheapest
GPT-5.4 mini                14      400   $0.00181
Claude Haiku 4.5           15*      400   $0.00201
Gemini 3.5 Flash           19*      400   $0.00363
Gemini 3.1 Pro             19*      400   $0.00484
GPT-5.4                     14      400   $0.00604
Claude Sonnet 5            15*      400   $0.00605
Claude Opus 4.8            15*      400   $0.01008
GPT-5.5                     14      400   $0.01207

Gemini 3.1 Flash-Lite is 20× cheaper than GPT-5.5 for this prompt.

* estimated count — set ANTHROPIC_API_KEY / GEMINI_API_KEY for exact counts.
```

## Install

```bash
npm i -g @labkit/token-cost   # once published
token-cost estimate "your prompt"

# or from this repo:
pnpm install && pnpm build
node packages/token-cost/dist/cli.js estimate "your prompt"
```

## Usage

```bash
# positional text
token-cost estimate "Summarize this quarterly report" --output 300

# from a file
token-cost estimate --file prompt.txt --output 500

# from stdin
cat prompt.txt | token-cost estimate --output 500

# machine-readable
token-cost estimate "your prompt" --json
```

The table at the top of this README is real output from the first command
above. Pricing covers 9 current models (GPT-5.5 / 5.4 / 5.4 mini, Claude Opus
4.8 / Sonnet 5 / Haiku 4.5, Gemini 3.1 Pro / 3.5 Flash / 3.1 Flash-Lite),
verified 2026-07-09 in `@labkit/core`'s registry. Gemini 3.1 Pro switches to its
long-context tier ($4/$18 per 1M) automatically above 200k input tokens.

## Exact vs estimated counts

- **OpenAI** — exact, offline, via `js-tiktoken` (`o200k_base`).
- **Anthropic** — honest estimate via `@anthropic-ai/tokenizer`, marked `*`.
  Set `ANTHROPIC_API_KEY` and counts upgrade to exact via the official
  count-tokens endpoint (free — it never bills tokens).
- **Google** — honest chars/4 estimate, marked `*`. Set `GEMINI_API_KEY` and
  counts upgrade to exact via the `countTokens` endpoint (also free).

API failures or timeouts silently fall back to the estimate — the command
never blocks or throws because a counting API was unreachable.

## Library

```ts
import { compare, resolveTokenizers } from "@labkit/token-cost";

// offline: exact OpenAI, estimates elsewhere
const results = compare("summarize this document", { outputTokens: 500 });
// -> CostEstimate[] sorted cheapest first:
//    { model, inputTokens, outputTokens, inputCost, outputCost, totalCost, exact }

// with keys in the env: upgrade Anthropic/Google to exact counts
const tokenizers = await resolveTokenizers("summarize this document", {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
});
const exact = compare("summarize this document", { outputTokens: 500, tokenizers });
```

## Playground

Open [`playground/index.html`](./playground/index.html) in a browser for a
zero-install, type-as-you-go version of the same comparison.
