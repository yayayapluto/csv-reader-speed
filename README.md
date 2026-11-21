# csv-reader-speed

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/yayayapluto/csv-reader-speed/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/yayayapluto/csv-reader-speed/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A faster drop-in for make.fun's csv-reader 1.0.0: `solve.js` parses broken CSV text left to right with the exact same reading policy and returns the identical `{columns, rows, errors}`, but scans code units and builds each field with one `slice` instead of concatenating one character at a time, and counts quoted-field line breaks in one pass. On the bounty's practice set (6 cases, 10.2 MB) it answers every case identically to csv-reader in about a quarter of the CPU time.

## Run it

```sh
node main.ts
```

The driver `main.ts` reads `/input/cases.json` (or `$MAKEFUN_INPUT_DIR/cases.json`), answers every case with `run()` from `solve.js`, and writes `/output/answers.json` (or `$MAKEFUN_OUTPUT_DIR/answers.json`).

<sub>Entered on [make.fun](https://make.fun/?ref=qjwj9qze&utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) for its “Read broken CSV files faster, 21 November 2026” bounty.</sub>
