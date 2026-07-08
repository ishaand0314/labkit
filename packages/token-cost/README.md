# @crosslab/token-cost

**Compare token counts and USD cost for the same text across models from every lab — one view, zero setup.**

`tiktoken` is OpenAI-only. Every other counter is single-provider. This shows you
the same prompt priced across OpenAI, Anthropic, and Google side by side, so you
can answer "which model is cheapest for this workload?" in one command.

## Usage

```bash
# CLI
token-cost estimate "your prompt here" --output 300
token-cost estimate "your prompt" --json
```

```ts
// Library
import { compare } from "@crosslab/token-cost";

const results = compare("summarize this document", { outputTokens: 500 });
// -> CostEstimate[], cheapest first
```

## Status

Works end-to-end today with an **approximate** tokenizer (~4 chars/token). For
exact counts, wire real per-lab tokenizers into the `tokenizers` option
(`js-tiktoken`, `@anthropic-ai/tokenizer`, etc.) — the interface is already there.

## Honest limitations

- Pricing in the registry is example data and goes stale; verify before trusting.
- Approximate token counts until real tokenizers are wired in.
