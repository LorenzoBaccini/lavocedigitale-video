# Format veloce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Video che fermano il pollice: gancio affermativo, soluzione intera, domanda finale da commentare, voce recitata e più svelta, regia senza pause oltre 1,5 s.

**Architecture:** Si cambia il copione (`agent-video.md` + `src/storyboard/`), la voce (`pipeline/voce-elevenlabs.ts`, `pipeline/allineamento.ts`) e la regia (`Overlay`, `regia.ts`, un ritmo comune intorno a ogni scena, la chiusura). Scene, set 3D, controllo d'impaginazione, storico e canali restano.

**Tech Stack:** Remotion 4.0.539 + three, Node 22 `--experimental-strip-types`, `node --test`, ffmpeg, ElevenLabs eleven_v3, `claude -p`.

**Spec:** `docs/superpowers/specs/2026-11-24-format-veloce-design.md`

## Global Constraints

- 0 € oltre a ElevenLabs: nessuna dipendenza nuova, nessun servizio nuovo.
- Fatti solo dall'articolo: `cifre.ts` e le regole di marchio restano bloccanti.
- Il controllo d'impaginazione resta bloccante e deve misurare anche i fotogrammi zoomati.
- Nessun tag `[...]` nel `testo` dello storyboard: i tag esistono solo nella stringa mandata a ElevenLabs.
- Commenti nel codice pochi, solo come avvertimento; il ragionamento va nella doc (README, spec).
- Commit: `<type>: <gitmoji> <descrizione in inglese>`, senza attribuzioni AI.

## Review Focus

- Un copione con il tono `sussurrato` sul gancio: la voce parte bassa sotto un colpo sonoro → il colpo va a volume moderato (test in Task 5 sul volume del colpo ≤ 0,6).
- Un'abbreviazione con parentesi quadre nell'articolo che finisce nel `testo` (es. «[beta]»): la validazione la scarta, altrimenti ElevenLabs la leggerebbe come tag (Task 1).
- Una frase brevissima (< 1 s) su cui cadono stacco, tick e scatto insieme → niente taglio di zoom sotto 60 frame (Task 5).
- Il `--riusa` su una cartella creata prima del cambio (solo `voce.mp3` non accelerato) → errore chiaro, non un video accelerato due volte (Task 3).
- La domanda finale più lunga ammessa (12 parole) nella scheda finale a 1080 px → nessun testo fuori margine (Task 6, matrice).

---

### Task 1: Storyboard v2 (tipi, varianti, validazione)

**Files:**
- Modify: `src/storyboard/tipi.ts`, `src/storyboard/valida.ts`, `src/editoriale/variante.ts`, `pipeline/storyboard.ts`, `pipeline/main.ts`, `pipeline/controlla-impaginazione.ts:124`
- Delete: `src/storyboard/fraseFinale.ts` (+ test)
- Test: `src/storyboard/valida.test.ts`, `src/editoriale/variante.test.ts`, `pipeline/storyboard.test.ts`, `pipeline/main.test.ts`

**Interfaces:**
- Produces:
  - `type Tono = "deciso" | "entusiasta" | "curioso" | "serio" | "sussurrato" | "sorpreso" | "ironico"`; `TONI: readonly Tono[]`; `TAG_TONO: Record<Tono, string>` (`deciso` → `""`, `entusiasta` → `"[excited]"`, `curioso` → `"[curious]"`, `serio` → `"[serious]"`, `sussurrato` → `"[whispers]"`, `sorpreso` → `"[surprised]"`, `ironico` → `"[sarcastic]"`).
  - `Frase.tono?: Tono` (assente = `deciso`).
  - `LIMITI_DURATA` nuovi: corta frasi 4-5 parole 28-40 secondi 11-16; media 5-7 / 40-56 / 16-22; lunga 7-8 / 56-72 / 22-28. Le parole contano **tutte** le frasi.
  - `LIMITI.gancioParole = 10`, `LIMITI.domandaParole = 12`, `LIMITI.toniMarcati = 2`.
  - `validaStoryboard(input: unknown, durata: NomeDurata): EsitoValidazione` (senza `fraseFinale`).
  - Variante: tolta `fraseFinale`; aggiunta `gancioTesto: NomeGancioTesto`, `GANCI_TESTO = ["errore", "segreto", "posta", "smentita", "situazione"] as const`, `PROFONDITA.gancioTesto = 3`, `VARIANTE_BASE.gancioTesto = "posta"`.
  - `pipeline/storyboard.ts`: `type Misura = Pick<Variante, "durata" | "gancioTesto">`.
  - Spariscono `TESTO_CHIUSURA`, `FRASI_CHIUSURA`, `paroleContenuto`, `conFraseFinale`.

- [ ] **Step 1: Test di validazione che falliscono** in `src/storyboard/valida.test.ts`:
  - `gancio con 11 parole` → errore che contiene `frasi[0].testo` e `10 parole`;
  - `gancio che finisce con ?` → errore `frasi[0].testo: il gancio è un'affermazione`;
  - `chiusura senza ?` → errore `frasi[n].testo: la domanda finale finisce con «?»`;
  - `chiusura con 13 parole` → errore `12 parole`;
  - `«link» o «articolo» in qualsiasi frase` (`"Trovi il link sotto"`, `"Nell'articolo c'è"`) → errore `niente rimandi al link o all'articolo`; `"Linkedin"` passa (confronto a parola intera normalizzata);
  - `testo con [beta]` → errore `nessuna parentesi quadra nel testo`;
  - `tono sconosciuto "arrabbiato"` → errore su `frasi[i].tono`;
  - `tre frasi sussurrato/ironico` → errore `al massimo 2`;
  - un copione `media` valido con 6 frasi e 48 parole, domanda finale `"Tu lo sapevi già?"` → ok.
- [ ] **Step 2:** `npm test` → FAIL sui test nuovi.
- [ ] **Step 3: Implementa** tipi, limiti e validazione come nelle Interfaces; aggiorna `variante.ts` (dimensione `gancioTesto` in `DIMENSIONI`, `ATTIVI`, `PROFONDITA`), `storyboard.ts` (`Misura`, `sezioneDurata` senza frase finale), `main.ts` (niente `conFraseFinale`; riga «Variante» con `gancio testo ${v.gancioTesto}` al posto di `frase finale`), `controlla-impaginazione.ts` (tolto il parsing di `fraseFinale`). Aggiorna i test esistenti che usavano `fraseFinale`/`TESTO_CHIUSURA`.
- [ ] **Step 4:** `npm test` → PASS (le fixture si aggiornano in Task 7; qui solo i test unitari).
- [ ] **Step 5: Commit** `feat: ✨ storyboard v2: statement hook, closing question, tones, shorter durations`

### Task 2: Copione (`agent-video.md` e prompt)

**Files:**
- Modify: `agent-video.md`, `pipeline/storyboard.ts`
- Test: `pipeline/storyboard.test.ts`

**Interfaces:**
- Consumes: `Misura`, `GANCI_TESTO`, `TONI`, `LIMITI_DURATA` (Task 1).
- Produces: `sezioneGancio(g: NomeGancioTesto): string` — una riga «Gancio di questo video: <famiglia>.» con la definizione e l'esempio della famiglia, presa da `DESCRIZIONE_GANCI: Record<NomeGancioTesto, { cosa: string; esempio: string }>` (testi della spec §1).

- [ ] **Step 1: Test che falliscono:** `sezioneGancio("smentita")` contiene `smentita` e `Windows dodici non esiste`; `promptBase` contiene la sezione gancio e la sezione durata con i limiti nuovi (media: `40 a 56 parole`).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: Riscrivi `agent-video.md`.** Restano le regole di fatto, marchi, scene, varietà, limiti dei campi. Cambiano:
  - regola 1 → il gancio è un'affermazione vera, al più 10 parole, della famiglia chiesta; scritto per chi scorre il feed, non per chi cerca su Google; leggibile anche muto (la chiave è la parola che ferma);
  - regola nuova → la seconda frase promette che cosa si impara («Ecco come…», «Si sistema in un minuto»);
  - regola 6 → l'ultima frase è la **domanda a chi guarda**, scena `chiusura`, al più 12 parole, facile da commentare (sì/no, una scelta fra due, la propria esperienza), legata al tema; mai «link», mai «articolo», mai chiedere like o follow;
  - regola 7 → il video dà la soluzione intera; niente «il resto è nell'articolo»;
  - regola nuova → `tono` per frase, elenco chiuso, al più 2 fra `sussurrato` e `ironico`; il tono segue il senso (un rischio `serio`, un trucco `sussurrato`, una sorpresa `sorpreso`), non va messo a caso; mai parentesi quadre nel `testo`;
  - regola 20 → nuova tabella durate; frasi corte (6-10 parole), una idea per frase;
  - i quattro esempi riscritti nel formato nuovo (gancio affermativo, toni, domanda finale), stessi articoli.
- [ ] **Step 4: Implementa** `sezioneGancio` e inseriscila in `promptBase` dopo `sezioneDurata`; `main.ts` passa `gancioTesto` nella misura.
- [ ] **Step 5:** `npm test` → PASS. **Commit** `feat: ✨ rewrite the video script prompt for feed viewers`

### Task 3: Voce recitata e più svelta

**Files:**
- Modify: `pipeline/voce-elevenlabs.ts`, `pipeline/allineamento.ts`, `README.md`
- Test: `pipeline/allineamento.test.ts`, `pipeline/voce-elevenlabs.test.ts`

**Interfaces:**
- Consumes: `TAG_TONO`, `Frase.tono` (Task 1).
- Produces:
  - `testoVoce(frasi: Pick<Frase, "testo" | "tono">[]): string` — frasi unite da spazio, ogni frase preceduta dal suo tag e uno spazio (nessun tag per `deciso`/assente).
  - `paroleDaAllineamento` ignora i token `[...]` (un token che inizia con `[` e finisce con `]`).
  - `RITMO = 1.1`, `STABILITA = 0.5` (costanti esportate); il body della richiesta contiene `voice_settings: { stability: STABILITA }`.
  - `accelera(allineamento: Allineamento, ritmo: number): Allineamento` — tempi divisi per `ritmo`, arrotondati al ms.
  - `scriviVoce(audio, allineamento, frasi, cartella)` salva `voce-originale.mp3` e `allineamento.json` grezzi, scrive `voce.mp3` accelerato con `atempo=${RITMO}` e lavora su `accelera(allineamento, RITMO)`.
  - `--riusa` legge `voce-originale.mp3`; se manca: errore `--riusa: manca voce-originale.mp3 (cartella di prima del format veloce)`.

- [ ] **Step 1: Test che falliscono:**
  - allineamento di `"[whispers] Ciao mondo. [excited] Via!"` (tempi fittizi per carattere) → 3 parole `Ciao`, `mondo.`, `Via!`;
  - `testoVoce([{testo:"A b.", tono:"serio"},{testo:"C d."}])` === `"[serious] A b. C d."`;
  - `accelera` con start `[0, 1.1]` e ritmo 1.1 → `[0, 1]`;
  - il body della chiamata (fetch finto) contiene `"stability":0.5` e il testo con i tag.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: Implementa** come nelle Interfaces; `voceElevenLabs` usa `testoVoce(storyboard.frasi)`; `frasiDaParole` resta sul `testo` senza tag.
- [ ] **Step 4:** `npm test` → PASS. Aggiorna la sezione «Rifare in locale» del README (`voce-originale.mp3`).
- [ ] **Step 5: Commit** `feat: ✨ expressive v3 voice with tones and 1.1x pace`

### Task 4: Sottotitoli cinetici

**Files:**
- Modify: `src/sottotitoli.ts`, `src/Overlay.tsx`, `src/sottotitoloAlFrame.ts`
- Test: `src/sottotitoli.test.ts`

**Interfaces:**
- Produces: `Parola.da?: number` (frame locale in cui la voce la dice, quando ci sono i tempi); blocchi da 1-3 parole, il più vicino possibile a 2 (`costoBlocco`: n=2 costo minimo, n=4 solo se legato, n≥5 mai salvo legato).

- [ ] **Step 1: Test che falliscono:** `"Il sistema appena installato nasce senza difese."` → nessun blocco oltre 3 parole; `"14 ottobre 2025"` resta in un blocco; con `inizi` ogni parola ha il suo `da`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: Implementa** i blocchi. In `Overlay`: corpo 84, la parola già detta piena, quella non ancora detta al 35 % di opacità, la parola che la voce sta dicendo scala 1,08 per 6 frame; la chiave in colore chiave con scatto (`pop` 0,85 → 1,12 → 1) quando viene detta. Stessa fascia (`SOTTOTITOLO_BASSO`, `MARGINE`), stessa logica di ridondanza.
- [ ] **Step 4:** `npm test` → PASS; still di prova con `controlla-impaginazione.ts fixtures/tutte-le-scene.storyboard.json out/still` → pulito.
- [ ] **Step 5: Commit** `feat: ✨ kinetic word-by-word subtitles`

### Task 5: Ritmo (gancio vivo, scatti, tagli di zoom, stacchi sonori)

**Files:**
- Create: `src/editoriale/ritmo.ts`, `src/editoriale/Ritmo.tsx`
- Modify: `src/editoriale/regia.ts` (`PAUSA_MAX = 45`), `src/editoriale/piani/gancio.ts`, `src/editoriale/variante.ts` (`ATTIVI.gancio`), `src/Notizia.tsx`, `suoni/foley.ts`, `pipeline/controlla-impaginazione.ts`
- Test: `src/editoriale/ritmo.test.ts`, `src/editoriale/piani/piani.test.ts`, `suoni/foley.test.ts`

**Interfaces:**
- Produces:
  - `tagliZoom(durata: number, inizi: number[]): number[]` — per frasi di almeno 60 frame un taglio al confine di parola più vicino a metà (`inizi` = frame d'inizio delle parole); altrimenti `[]`.
  - `scalaRitmo(f: number, durata: number, chiave: number, tagli: number[], i: number): number` — base 1 (frasi pari) o 1,05 (dispari); dopo ogni taglio si passa all'altra base; più uno scatto di 0,035 alla chiave che decade in 10 frame. Mai oltre 1,09.
  - `Ritmo: React.FC<{ durata: number; chiave: number; tagli: number[]; indice: number; children }>` — `transform: scale()` centrato.
  - Foley nuovi in `FOLEY`: `whoosh` (rumore filtrato a banda che sale, 0,25 s), `tick` (0,04 s), `colpo` (basso breve, 0,3 s).
  - Piano gancio: con la frase intera come titolo, tutte le parole hanno `da = 0` (testo intero al fotogramma 0).
  - Controllo d'impaginazione: per ogni frase misura anche `taglio + 1` e `chiave + 3`.
- [ ] **Step 1: Test che falliscono:** `tagliZoom(45, …)` → `[]`; `tagliZoom(90, [0,20,40,55,70])` → `[40]`; `scalaRitmo` ≤ 1,09 su tutti i frame di una frase con 2 tagli; `pianoGancio` con frase corta → ogni `parole[k].da === 0`; `FOLEY.whoosh()` dura fra 0,2 e 0,3 s; `accentiMancanti([], 90)` (nuovo `PAUSA_MAX`) → `[30, 60]`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: Implementa.** In `Notizia` ogni scena (non la chiusura) sta dentro `Ritmo`; effetti aggiunti a ogni frase: `colpo` (volume 0,5) al frame 0 della prima, `whoosh` (0,45) al frame 0 delle altre, `tick` (0,35) alla chiave. Gancio: tieni in `ATTIVI.gancio` solo le varianti che mostrano il testo al fotogramma 0 (verifica con uno still a frame 0 per `scena`, `parola`, `dettaglio`, `diviso`; togli quelle che non lo fanno) e aggiungi uno zoom lento continuo (1 → 1,04 sulla durata del gancio) dentro `Ritmo` solo per `indice === 0`.
- [ ] **Step 4:** `npm test` → PASS; still a frame 0 dei ganci in `out/gancio0/` letti a occhio.
- [ ] **Step 5: Commit** `feat: ✨ fast pacing: live first frame, punch-ins, zoom cuts, whooshes`

### Task 6: Chiusura con la domanda

**Files:**
- Modify: `src/scenes/Chiusura.tsx`, `src/scenes/ChiusuraIntegrata.tsx`, `src/editoriale/piani/chiusura.ts`, `src/linea.ts`, `src/Overlay.tsx`
- Test: `src/editoriale/piani/piani.test.ts`, `src/linea.test.ts`

**Interfaces:**
- Produces: `pianoChiusura` con `domanda: number` (frame in cui la domanda è scritta per intero, al più 6) e `invito: number` (quando entra «Scrivilo nei commenti ↓», alla fine della voce); `CODA_FINALE_S = 1.5` in `linea.ts` aggiunto alla sola ultima frase.

- [ ] **Step 1: Test che falliscono:** l'ultima durata della linea = clip + 1,5 s; `pianoChiusura` → `domanda ≤ 6`, `invito` ≥ ultima parola.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: Implementa.** Cartolina: la domanda grande (corpo 92, max 4 righe), sotto «Scrivilo nei commenti» con una freccia che pulsa verso il basso, il logo e `lavocedigitale.it` piccoli in fondo. Integrata: la fascia mostra la domanda al posto dell'attacco e l'invito al posto dell'indirizzo grande. Il sottotitolo resta nascosto nella chiusura.
- [ ] **Step 4:** `npm test` → PASS. **Commit** `feat: ✨ end on a question that asks for a comment`

### Task 7: Fixture, matrice, post

**Files:**
- Modify: `fixtures/*.storyboard.json`, `fixtures/matrice.py`, `fixtures/windows10.*`, `fixtures/README.md`, `pipeline/post-video.ts`
- Test: `pipeline/post-video.test.ts`, `src/fixture.test.ts`

**Interfaces:**
- Produces: `buildVideoPost(a, storyboard)` = gancio, riga vuota, domanda finale, riga vuota, URL, riga vuota, hashtag; se supera 280 (regola t.co) si tolgono gli hashtag, poi la domanda, poi si accorcia il gancio.

- [ ] **Step 1: Test che falliscono** sul post: ordine gancio/domanda/link/hashtag; con un gancio di 250 caratteri resta solo gancio accorciato + link.
- [ ] **Step 2: Implementa** il post. Aggiorna tutte le fixture (ultima frase = una domanda, niente `TESTO_CHIUSURA`, un paio di `tono`) e `matrice.py`, rigenera le matrici.
- [ ] **Step 3:** `npm test` → PASS; matrice:
  ```
  for f in fixtures/matrice-*.storyboard.json; do node --experimental-strip-types pipeline/controlla-impaginazione.ts $f out/matrice --passo=5 --secondi=4; done
  ```
  Expected: nessun problema su nessuna fixture.
- [ ] **Step 4: Commit** `feat: ✨ post text with the closing question; fixtures on the new format`

### Task 8: Campioni veri e consegna

- [ ] **Step 1:** Per i tre articoli degli artifact (`chromebook-non-si-accende-…`, `windows-12-quando-esce-…`, `windows-11-pc-non-supportati-…`) lancia `pipeline/main.ts articolo.json --prova` in locale (Claude + ElevenLabs veri, nessun post). Uno dei tre anche con `STABILITA = 0` per confronto d'ascolto.
- [ ] **Step 2:** Fogli di provini vecchio/nuovo affiancati e durata; tempo di render annotato.
- [ ] **Step 3:** README (cosa fa la pipeline, voce, chiusura) e spec aggiornati con le scelte fatte; PLAYBOOK di La Voce Digitale: esperimento «format veloce» con la soglia della spec (PR separata nel repo privato, solo docs).
- [ ] **Step 4:** Push e PR verso `main`; merge solo con l'ok dell'utente.
