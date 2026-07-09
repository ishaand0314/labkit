# @labkit/core

Shared primitives for labkit tools: TypeScript types, the cross-lab model
registry, and a small CLI router.

- **Model registry**: 24 current models across OpenAI, Anthropic, Google, xAI,
  and open-weight hosts, with input/output pricing per 1M tokens plus each
  model's known limitations. Pricing verified 2026-07-10.
- **Types**: provider/model/pricing interfaces used by every labkit package.
- **CLI router**: minimal command routing shared by labkit CLIs.

Consumed by tools like [`@labkit/token-cost`](../token-cost). You usually do
not need to install this package directly.

See the [root README](../../README.md) for the full labkit overview.

MIT © Ishaan Das
