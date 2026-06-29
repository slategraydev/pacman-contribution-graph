# Learning Upgrade TODO

Status: implemented in `src/core/evolution.ts`.

Goal: replace the current random hill-climber with a small, testable optimizer that improves Pac-Man DNA against stable benchmarks without adding heavy ML dependencies.

## Recommended Path

1. **Keep a benchmark suite, not one board**
   - Store 3-5 benchmark grids in `pacman-intelligence.json`.
   - Seed it with the first few real contribution grids seen by the action.
   - Score each DNA by average score across all benchmark grids.
   - Acceptance: a DNA update must improve the average benchmark score, not just one board.

2. **Persist a small elite population**
   - Replace single `dna` with `population: { dna, score }[]`.
   - Keep the top 5 candidates after each generation.
   - Generate new candidates from elites by mutation and crossover.
   - Acceptance: the best saved DNA never regresses, and weaker variants can still explore.

3. **Use deterministic tournament randomness**
   - Add a tiny seeded PRNG for mutation choices.
   - Save the current seed/generation in intelligence.
   - Acceptance: tests can replay a generation exactly.

4. **Broaden mutation strategy**
   - Keep the current +/-10% local mutation.
   - Add occasional larger mutation, around +/-40%, to escape local optima.
   - Clamp each metric to sane bounds:
     - `safe`: 0.1-10
     - `greed`: 0.1-10
     - `rad`: 2-20
     - `stuck`: 0-500
     - `hunt`: 0.1-20
   - Acceptance: generated DNA values always stay valid.

5. **Separate score display from optimizer score**
   - Keep showing `SCORE` as the best benchmark score.
   - Optionally add `RUN` later for today's actual SVG run score.
   - Acceptance: users can tell learning progress apart from today's board result.

6. **Add optimizer tests before refactoring**
   - Test benchmark averaging.
   - Test elite retention.
   - Test mutation clamps.
   - Test deterministic replay from seed.
   - Acceptance: optimizer logic can move out of `game.ts` without changing behavior.

## First Implementation Step

Extract the tournament code from `src/core/game.ts` into a small optimizer module:

- `src/core/evolution.ts`
- Export one function: `evolveIntelligence(store, runSimulation)`
- Keep `game.ts` responsible for rendering and game lifecycle only.

This gives the optimizer a clean place to grow without turning the main game loop into a research project.
