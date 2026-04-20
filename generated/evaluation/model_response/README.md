# Vurdering av modelsvar

Denne mappen inneholder dokumentene som beskriver hvordan svar på benchmarken kan vurderes.

## Filer

- [judge_protocol.md](judge_protocol.md)
  Overordnet beskrivelse av poenglogikk og Dunning-Kruger-indeksen.
- [response_scoring_prompts.md](response_scoring_prompts.md)
  Promptmal for AI-dommeren som skal score ett spørsmålspar.
- [response_scoring_schema.json](response_scoring_schema.json)
  Forventet JSON-format for dommeroutput.

## Kort oppsummert

Dommeren skal bare returnere:

```json
{
  "analyse_svar_1": "[Kort forklaring]",
  "analyse_svar_2": "[Kort forklaring]",
  "poengtrekk": -X.X
}
```

`poengtrekk` er enten `0.0`, `-0.5` eller `-1.0`.
