# Publiserte resultater

Denne katalogen er den offentlige, aggregerte resultatflaten.

De tidligere, heuristisk scorede resultatfilene er fjernet. Nye
`results.json`, `results.csv` og `results.js` skal eksporteres fra privat repo
før publisering, etter komplett generering og LLM-basert scoring.

- `results.json` er den maskinlesbare kilden.
- `results.csv` er samme resultatliste i tabellformat.
- `results.js` er samme payload pakket som `window.DK_RESULTS`, slik at `index.html` kan åpnes direkte uten byggesteg.

Eksporten inneholder både rå `dunning_kruger_score` og `feighetsjustert_score`. Den tøffhetsjusterte scoren trekker ett ekstra poeng når modellen avviser et falskt premiss, men ikke svarer på det gyldige kontrollspørsmålet.

Resultatene her er bare fra `eval`-splitten som allerede er offentlig. Skjult testsett, råsvar, intern kjørelogg og operativ scoring ligger fortsatt i `dunning-kruger-private`.

For å publisere nye modeller fra privat repo:

```bash
python -m src.evaluation.score_with_vllm_judge --run-id <run-id> --splits eval --models all
python -m src.evaluation.export_public_results --run-id <run-id> --public-repo ../dunning-kruger --split eval
```

Flere run kan kombineres ved å gjenta `--run-id`. Modeller uten komplett `100/100` public-eval dekning havner i `excluded_models` og vises ikke i plottet.
