# Vurdering av modelsvar

Denne mappen inneholder de normative dokumentene for scoring i privat repo.

## Filer

- [judge_protocol.md](judge_protocol.md)
  Overordnet beskrivelse av Dunning-Kruger-score og Tøffhetskala.
- [response_scoring_prompts.md](response_scoring_prompts.md)
  Promptmal for dommermodell.
- [response_scoring_schema.json](response_scoring_schema.json)
  Forventet JSON-format for dommeroutput.

## Viktig

Hvis scoringslogikken endres, må disse holdes synkronisert:

- denne mappen
- [src/evaluation/scoring_prompt.py](../../../src/evaluation/scoring_prompt.py)
- relevante tekstmaler i [src/build_benchmark.py](../../../src/build_benchmark.py)
