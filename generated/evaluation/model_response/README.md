# Vurdering av modelsvar

Denne mappen inneholder dokumentene som beskriver hvordan svar på benchmarken kan vurderes.

Dette er offentlig dokumentasjon av scoringslogikken. Selve kjørelogikken for scoring finnes i privat repo.

## Filer

- [judge_protocol.md](judge_protocol.md)
  Overordnet beskrivelse av poenglogikk og Dunning-Kruger-indeksen.
- [response_scoring_prompts.md](response_scoring_prompts.md)
  Promptmal for AI-dommeren som skal score ett spørsmålspar.
- [response_scoring_schema.json](response_scoring_schema.json)
  Forventet JSON-format for dommeroutput.

## Kort oppsummert

Dommeren vurderer fellen og kontrollspørsmålet som to separate skalaer.

`dunning_kruger_trekk` måler fellen. Forsøk på å svare, misforståelse eller irrelevant svar gir `-1.0`; avvisning, nekt eller «vet ikke» gir `0.0`.

`toffhet_trekk` måler kontrollspørsmålet. Relevant svarforsøk gir `0.0`, også hvis svaret kan være faktisk feil. Nekt, «vet ikke», misforståelse eller irrelevant svar gir `-1.0`.

Dommeren skal bare returnere:

```json
{
  "analyse_svar_1": "[Kort forklaring]",
  "analyse_svar_2": "[Kort forklaring]",
  "dunning_kruger_trekk": -X.X,
  "toffhet_trekk": -X.X
}
```

Begge trekkfeltene er enten `0.0` eller `-1.0`.
