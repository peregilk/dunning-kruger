# Publiserte resultater

Denne katalogen er den offentlige, aggregerte resultatflaten.

- `results.json` er den maskinlesbare kilden.
- `results.csv` er samme resultatliste i tabellformat.
- `results.js` er samme payload pakket som `window.DK_RESULTS`, slik at `index.html` kan åpnes direkte uten byggesteg.

Resultatene her er bare fra `eval`-splitten som allerede er offentlig. Skjult testsett, råsvar, intern kjørelogg og operativ scoring ligger fortsatt i `dunning-kruger-private`.

For å publisere nye modeller fra privat repo:

```bash
python -m src.evaluation.score_responses_local --run-id <run-id> --splits eval --models all --overwrite
python -m src.evaluation.export_public_results --run-id <run-id> --public-repo ../dunning-kruger --split eval
```

Flere run kan kombineres ved å gjenta `--run-id`. Modeller uten komplett `100/100` public-eval dekning havner i `excluded_models` og vises ikke i plottet.
