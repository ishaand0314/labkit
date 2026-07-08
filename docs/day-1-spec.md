# Day 1 Spec — `@crosslab/token-cost`

**Goal:** ship a cross-lab token + cost comparator. The template already contains
a working skeleton; today is about making the counts *real* and the output
*shareable*. Timebox: build in the morning, ship by early afternoon, post by evening.

## The one-sentence pitch
Paste text, see token count and USD cost side-by-side across OpenAI, Anthropic,
and Google — in one command, zero setup.

## Already done (in the template)
- `compare()` / `estimateForModel()` library API, cheapest-first sorting
- Cross-lab model registry with pricing shape
- CLI with `estimate`, `--output`, `--json`, `--help`
- Passing tests, stale-pricing warning

## Today's build (in priority order)
1. **Real tokenizers.** Replace `heuristicTokenizer` with actual per-lab
   tokenizers via the existing `tokenizers` option. Start with OpenAI
   (`js-tiktoken`); approximate the others honestly and label them as estimates.
   *Acceptance:* counting a known string matches the official tokenizer within
   the exact-vs-estimate labeling.
2. **Verify + expand the registry.** Update `registry.ts` with current pricing
   for ~6–8 models you actually care about, and set `verified` to today.
   *Acceptance:* no stale-pricing warning on a fresh run.
3. **Shareable output.** Make the default table clean enough to screenshot —
   aligned columns, a "cheapest" marker, and a one-line summary
   ("Gemini 2.0 Flash is 40× cheaper than Claude Sonnet 4 for this prompt").
   *Acceptance:* the screenshot reads clearly with zero extra explanation.

## Stretch (only if ahead)
- Read text from a file or stdin: `token-cost estimate --file prompt.txt`.
- A tiny single-page web playground for the LinkedIn screenshot.
- Publish to npm under your scope.

## Definition of done
- [ ] `pnpm build && pnpm lint && pnpm test` all green
- [ ] Real (or honestly-labeled) token counts
- [ ] Registry verified today, no stale warning
- [ ] README with a usage example + one screenshot
- [ ] Repo public, LinkedIn post live

## Working with Claude Code today
Point it at `docs/architecture.md` and `docs/adding-a-tool.md` first so it
respects the shared-core pattern. Give it the tests as the target ("make these
pass, don't restructure the interfaces"). The strict tsconfig will keep it on
the rails — if it tries to widen a type to `any`, that's your signal to redirect.
