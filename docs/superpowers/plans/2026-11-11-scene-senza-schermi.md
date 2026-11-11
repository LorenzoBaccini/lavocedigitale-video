# Scene senza schermi — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fare in modo che la notifica cerchiata e il dispositivo in scena smettano di tornare in ogni video: la notifica diventa un'eccezione e arrivano quattro scene 2D senza schermi (`simbolo`, `passi`, `flusso`, `mappa`).

**Architecture:**
- Le regole nuove vivono nella validazione dello storyboard, accanto a `erroriVarieta`, così la riprova gratuita di `claude -p` le corregge.
- Il segno della notifica è un dettaglio deterministico dallo slug.
- Le scene nuove seguono lo schema delle scene su carta (`Numero`, `Confronto`):
  - un piano puro in `src/editoriale/piani/`, con i tempi dalla voce, i testi a schermo e gli eventi;
  - un componente su `Foglio`, che si adatta da solo ai quattro stili;
  - la registrazione in `SCENE`, `pianoScena`, `SU_CARTA` e nella validazione.

**Tech Stack:** Remotion 4.0.364, React 18, TS eseguito con `node --experimental-strip-types`, `node:test`. Nessun `tsc` nel repo: i tipi li controlla la lettura del codice, i test controllano il comportamento.

**Spec:** `docs/superpowers/specs/2026-11-11-scene-senza-schermi-design.md`

## Global Constraints

- Zero dipendenze nuove, zero servizi esterni, zero chiamate a ElevenLabs.
- Repo pubblico: niente percorsi locali, nomi utente o dati personali nei file e nei commit.
- Commit: `<type>: <gitmoji> <descrizione in inglese>`, senza Co-Authored-By né altre attribuzioni.
- Identificatori e commenti in italiano, come il resto del codice, con la stessa densità di commento: una riga sopra le
  funzioni e i componenti, niente commenti ovvi.
- Export con nome; un componente per file.
- `DETTAGLI_BASE` e `VARIANTE_BASE` devono restare pixel-identici: la regressione di scrivania non cambia.
- Test: `npm test` deve passare tutto (oggi 459/459).
- Render pesanti uno alla volta, con `caffeinate -i` e `RENDER_GL=angle`.
- Ogni scena nuova:
  - marca i suoi testi con `data-impaginazione` come le altre, perché `controlla-impaginazione` li misuri;
  - deve uscire pulita nei quattro stili (`--stile=scrivania|studio|notte|schermo`).
- Pittogrammi generici: nessun marchio, nessun logo.

## Review Focus

- Testi al limite (`LIMITI`) in tutti e quattro gli stili: niente fuori dai margini e niente sovrapposizioni con il
  sottotitolo. Lo prova `controlla-impaginazione` sulla fixture delle scene nuove.
- Frasi cortissime (`--secondi=1.2`): ogni tempo del piano resta dentro `durata`, con la scena intera visibile prima
  della fine. Ci sono test sui piani con `durata` piccola.
- Una voce che non dice mai la chiave o i testi della scena: i tempi ripiegano su frazioni della durata e restano
  ordinati. Ci sono test sui piani con una voce senza parole corrispondenti.
- Un copione con due `allarme`, o con troppe scene su dispositivo: va scartato con un messaggio che dica a Claude
  cosa cambiare. Test in `valida.test.ts` / `varieta.test.ts`.
- Lo stile schermo: `AllarmeSchermo` rispetta `segnoNotifica` come `Allarme`.

---

### Task 1: la notifica come eccezione (A)

**Files:**
- Modify: `src/storyboard/valida.ts`. In `erroriVarieta`:
  - al massimo un `allarme`;
  - scene su dispositivo `≤ Math.ceil(n / 2)`.
- Modify: `src/editoriale/dettagli.ts`. Nuovo campo `segnoNotifica`:
  - `DETTAGLI_BASE` lo mette a `"cerchio"`;
  - `dettagliDi` lo sceglie con `scelta(slug, "segno", 3)`.
- Modify: `src/scenes/Allarme.tsx` e `src/editoriale/schermo/AllarmeSchermo.tsx`: il cerchio solo con `cerchio`, le
  sottolineature con `cerchio` e `sottolinea`, nessun segno con `nessuno`.
- Modify: `pipeline/controlla-impaginazione.ts`, solo se `--dettagli=base` o i dettagli forzati costruiscono un oggetto
  `Dettagli` a mano: va aggiunto il campo.
- Modify: `agent-video.md`. La regola 9 dice che `allarme` serve solo per un messaggio che il sistema o un'app mostrano
  davvero secondo l'articolo, al massimo una volta per video. Una regola nuova, accanto alla 16, dice:
  - al massimo metà delle scene, chiusura esclusa, su un dispositivo;
  - quali scene contano.

  Gli esempi li riscrive il Task 6.
- Test: `src/storyboard/varieta.test.ts`, `src/editoriale/dettagli.test.ts`.

**Interfaces:**
- Produces, in `src/storyboard/valida.ts`:
  - `export const MASSIMO_ALLARMI = 1`;
  - `export function suDispositivo(scena: Scena): boolean`: vero per `gancio`, `allarme`, `rischio` e `telefono`, e
    per `oggetto` con `oggetto` `portatile` o `smartphone`;
  - `export const massimoSuDispositivo = (scene: number) => Math.ceil(scene / 2)`.
- Produces, in `src/editoriale/dettagli.ts`:
  - `export const SEGNI_NOTIFICA = ["cerchio", "sottolinea", "nessuno"] as const`;
  - `export type SegnoNotifica`;
  - `Dettagli.segnoNotifica: SegnoNotifica`.

- [ ] **Step 1: test che falliscono**
  - In `varieta.test.ts`:
    - un copione medio con due `allarme`, non di fila, produce un errore che contiene `«allarme»` e `al massimo 1`;
    - uno con un solo `allarme` non lo produce;
    - un copione di 6 scene più la chiusura, con 4 scene su dispositivo (gancio, allarme, rischio, oggetto/smartphone),
      produce un errore che contiene `su un dispositivo` e `al massimo 3`;
    - con 3 su dispositivo, nessun errore;
    - `oggetto` con `oggetto: "carta"` non conta;
    - `suDispositivo` su ogni tipo.
  - In `dettagli.test.ts`:
    - `DETTAGLI_BASE.segnoNotifica === "cerchio"`;
    - su 300 slug sintetici `dettagliDi` produce tutti e tre i segni, ciascuno fra il 20 e il 47 %;
    - `segnoNotifica` non è correlato alla finitura: la tabella delle coppie ha tutte le 12 combinazioni.
- [ ] **Step 2:** `npm test` → falliscono i test nuovi.
- [ ] **Step 3: implementazione.** I messaggi d'errore sono in italiano e dicono cosa fare, come gli altri di
  `erroriVarieta`:
  - `sequenza: 2 scene «allarme», al massimo 1: la notifica solo se l'articolo parla di un messaggio vero, per le altre frasi scegli un'altra scena`;
  - `sequenza: 4 scene su un dispositivo (telefono o portatile) su 6, al massimo 3: mostra le altre frasi su carta, con simboli, passi, flussi o mappe`.

  Le parole `simboli, passi, flussi o mappe` restano: il Task 2 aggiunge le scene.
- [ ] **Step 4:** `npm test`, tutto verde.
- [ ] **Step 5: verifica a vista.** Con `controlla-impaginazione` sulla fixture `windows10`, `--scene=allarme`, la
  cartella degli still, un `--stile` 3D e uno `schermo`, controlla:
  - che con `--dettagli=base` il segno sia uguale a prima;
  - che gli altri due segni compaiano forzando `segnoNotifica`, se c'è un modo di forzarlo; altrimenti con un test
    sul componente o con slug scelti apposta.
- [ ] **Step 6: commit.** `feat: ✨ make the notification an exception and cap device scenes per video`

### Task 2: i pittogrammi e la scena `simbolo`

**Files:**
- Modify: `src/storyboard/tipi.ts`:
  - `Simbolo` e `SIMBOLI`;
  - la variante di `Scena` `{ tipo: "simbolo"; etichetta: string; simbolo: Simbolo; titolo: string; barrato?: boolean }`.
- Modify: `src/storyboard/valida.ts`. Nel controllo `simbolo`:
  - `etichetta` ≤ `LIMITI.etichetta`;
  - `simbolo` uno di `SIMBOLI`;
  - `titolo` ≤ `LIMITI.titolo`;
  - `barrato`, se c'è, booleano.
- Create: `src/editoriale/pittogrammi/tracciati.ts`. `TRACCIATI: Record<Simbolo, string[]>`: tracciati SVG `d` in un
  riquadro 100×100, solo linee (`stroke`, niente `fill`), con lo stesso spessore ottico. Nessun marchio.
- Create: `src/editoriale/pittogrammi/Pittogramma.tsx`. `Pittogramma: React.FC<{ simbolo: Simbolo; lato: number; colore: string; progresso: number; spessore?: number }>`
  traccia i percorsi in ordine:
  - con `pathLength=1`, `strokeDasharray=1` e `strokeDashoffset=1-p`, così `progresso` va da 0 a 1 su tutti i
    tracciati in sequenza;
  - con `strokeLinecap` e `strokeLinejoin` `round`.
- Create: `src/editoriale/pittogrammi/index.ts`, il barrel.
- Create: `src/editoriale/piani/simbolo.ts`. `pianoSimbolo(s: ScenaDi<"simbolo">, durata): PianoSimbolo`, con
  `PianoSimbolo extends PianoCarta { simbolo: number; titolo: number; barra?: number }`:
  - il pittogramma si traccia da subito, in circa 18 frame;
  - il titolo arriva quando la voce dice la chiave;
  - la barra, se `barrato`, passa dopo il titolo, a pennarello.
- Create: `src/scenes/Simbolo.tsx`. Su `Foglio tipo="liscia"`:
  - in alto l'occhiello;
  - al centro il pittogramma grande, circa 520 px, con il colore d'inchiostro dello stile;
  - con `barrato`, una diagonale a mano con `SegnoInQuadro` nel colore `accentoSuChiaro`;
  - sotto il titolo, con `Titolo`.
- Modify: registrazione in `src/scenes/index.ts`, in `src/editoriale/piani/index.ts` e in `SU_CARTA`
  (`src/editoriale/carta/stile.ts`).
- Create: `src/editoriale/piani/simbolo.test.ts`. Modify: `src/storyboard/valida.test.ts`.
- Create: `fixtures/scene-nuove.storyboard.json`. Questo task ci mette 2 `simbolo` (uno con `barrato`, uno con titolo da
  24 caratteri) e la chiusura; i task successivi aggiungono le loro scene. Va in `fixtures/README.md`.

**Interfaces:**
- Produces:
  - `Simbolo`, `SIMBOLI` da `src/storyboard/tipi.ts`;
  - `Pittogramma` da `src/editoriale/pittogrammi`;
  - `TRACCIATI`.
- Consumes: `suCarta`, `PianoCarta` (`piani/carta.ts`), `quandoDice` (`editoriale/voce.ts`), `Foglio`, `Occhiello`,
  `Titolo`, `SegnoInQuadro`, `useStile`.

- [ ] **Step 1: test che falliscono.**
  - Validazione:
    - `simbolo` valido passa;
    - `simbolo: "razzo"` dà un errore che elenca `SIMBOLI`;
    - un titolo di 25 caratteri dà errore;
    - `barrato: "sì"` dà errore.
  - Piano:
    - con una voce che dice la chiave al frame 30, `titolo >= 30`;
    - con `durata` 36, ogni tempo è `< durata - 8`;
    - con una voce senza la chiave, i tempi restano ordinati (`simbolo < titolo < barra`);
    - `testi` contiene `etichetta` e `titolo`.
  - Tracciati: ogni chiave di `SIMBOLI` ha almeno un tracciato, e ogni `d` contiene solo comandi SVG validi con le
    coordinate in [0, 100].
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** implementazione.
- [ ] **Step 4:** `npm test` → verde.
- [ ] **Step 5: impaginazione.** Esegui
  `controlla-impaginazione.ts fixtures/scene-nuove.storyboard.json <still> --scene=simbolo --passo=5` in ognuno dei 4
  stili. Deve uscire pulito; guarda gli still e controlla che i pittogrammi si riconoscano.
- [ ] **Step 6: commit.** `feat: ✨ add hand-drawn pictograms and the simbolo scene`

### Task 3: la scena `passi`

**Files:**
- Modify: `tipi.ts`:
  - `interface Passo { testo: string; simbolo?: Simbolo }`;
  - la variante `{ tipo: "passi"; etichetta: string; passi: Passo[] }`;
  - `LIMITI.passi = { min: 2, max: 4 }` e `LIMITI.passo = 28`.
- Modify: `valida.ts`:
  - da 2 a 4 passi;
  - ogni `testo` obbligatorio, di al massimo 28 caratteri;
  - `simbolo` facoltativo, uno di `SIMBOLI`.
- Create: `src/editoriale/piani/passi.ts`. `pianoPassi`, con `PianoPassi extends PianoCarta { passi: number[] }`:
  - l'entrata di ogni passo, il primo subito;
  - gli altri quando la voce dice una parola del loro testo (`quandoDice`), altrimenti distribuiti fino al 70 % della
    durata;
  - tempi sempre crescenti, di almeno 8 frame l'uno dall'altro.
- Create: `src/scenes/Passi.tsx`. Su `Foglio tipo="quadretti"`:
  - l'occhiello;
  - una colonna di righe, ciascuna con il numero in un cerchio fatto a mano (`cerchiatura`, colore `accentoSuChiaro`),
    il pittogramma piccolo, circa 96 px, se c'è, e il testo;
  - le righe entrano con il loro tempo;
  - l'altezza delle righe si adatta a 2–4 passi dentro la zona utile (`TITOLO_TOP`…`FONDO_UTILE` di `impaginazione.ts`).
- Registrazioni (index, piani, `SU_CARTA`), test, e 2 `passi` nella fixture `scene-nuove`: uno da 4 passi con testi da
  28 caratteri e pittogrammi, uno da 2 passi senza.

- [ ] **Step 1: test che falliscono.**
  - Validazione: 1 passo dà errore, 5 passi danno errore, un testo da 29 caratteri dà errore, un simbolo sconosciuto
    dà errore.
  - Piano: tempi crescenti, distanti almeno 8 frame, dentro `durata - 8` anche con `durata` 40 e 4 passi.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** implementazione.
- [ ] **Step 4:** `npm test` → verde.
- [ ] **Step 5:** impaginazione `--scene=passi --passo=5` nei 4 stili, pulita.
- [ ] **Step 6: commit.** `feat: ✨ add the passi scene with numbered steps`

### Task 4: la scena `flusso`

**Files:**
- Modify: `tipi.ts`:
  - `interface Nodo { testo: string; simbolo?: Simbolo }`;
  - la variante `{ tipo: "flusso"; etichetta: string; nodi: Nodo[] }`;
  - `LIMITI.nodi = { min: 2, max: 3 }` e `LIMITI.nodo = 18`.
- Modify: `valida.ts`, con controlli come per `passi`.
- Create: `src/editoriale/piani/flusso.ts`. `pianoFlusso`, con
  `PianoFlusso extends PianoCarta { nodi: number[]; frecce: number[] }`: ogni freccia parte dopo il nodo che la
  precede e arriva prima del nodo che segue.
- Create: `src/scenes/Flusso.tsx`. Su `Foglio tipo="liscia"`, i nodi incolonnati dall'alto in basso, perché il
  formato è verticale:
  - ogni nodo è un riquadro a mano con il pittogramma, se c'è, e il testo;
  - fra un nodo e l'altro c'è una freccia a pennarello, tracciata con `SegnoInQuadro`, che si disegna;
  - l'ultimo nodo ha l'accento (`accentoSuChiaro`).
- Registrazioni, test, e 2 `flusso` nella fixture: uno da 3 nodi con testi da 18 caratteri e simboli, uno da 2 nodi.

- [ ] **Step 1: test che falliscono.**
  - Validazione: 1 nodo e 4 nodi danno errore, un testo da 19 caratteri dà errore.
  - Piano:
    - `nodi[i] < frecce[i] < nodi[i+1]`;
    - tutto entro `durata - 8` con `durata` 36;
    - i tempi ripiegano senza la voce.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** implementazione.
- [ ] **Step 4:** `npm test` → verde.
- [ ] **Step 5:** impaginazione `--scene=flusso --passo=5` nei 4 stili, pulita.
- [ ] **Step 6: commit.** `feat: ✨ add the flusso scene with arrows between steps`

### Task 5: la scena `mappa`

**Files:**
- Modify: `tipi.ts`:
  - `type FormaMappa = "punto" | "area" | "percorso"` e `FORME_MAPPA`;
  - la variante `{ tipo: "mappa"; etichetta: string; titolo: string; forma: FormaMappa; luoghi: string[] }`;
  - `LIMITI.luogo = 20`.
- Modify: `valida.ts`:
  - `forma` una di `FORME_MAPPA`;
  - `luoghi` deve avere 1 elemento con `punto` e `area`, 2 con `percorso`, ciascuno di al massimo 20 caratteri;
  - `titolo` ≤ 24.
- Create: `src/editoriale/pittogrammi/piantina.ts`. Una piantina generica, deterministica da un seme:
  - qualche isolato a griglia storta e una strada principale curva;
  - forse un'ansa di fiume;
  - nessun nome di luogo vero.

  `piantina(seme: number): { strade: string[]; isolati: string[] }`, tracciati in un riquadro 1000×1000.
- Create: `src/editoriale/piani/mappa.ts`. `pianoMappa`, con
  `PianoMappa extends PianoCarta { piantina: number; segno: number; luoghi: number[]; titolo: number }`:
  - la piantina appare in dissolvenza;
  - poi si traccia il segno: lo spillo che cade per `punto`, la cerchiatura a mano per `area`, il tratteggio da A a B
    per `percorso`;
  - le etichette dei luoghi arrivano con la voce;
  - il titolo arriva sulla chiave.
- Create: `src/scenes/Mappa.tsx`. Su `Foglio tipo="liscia"`:
  - occhiello in alto;
  - la piantina in un riquadro quadrato al centro, con linee a inchiostro tenue;
  - il segno in `accentoSuChiaro`;
  - lo spillo è il pittogramma `posizione`;
  - le etichette dei luoghi sono note a mano vicino al segno, dentro il riquadro;
  - il titolo sotto la piantina.
  - Il seme della piantina viene da `improntaMescolata(etichetta + titolo)`, così ogni video ha la sua.
- Registrazioni, test, e 3 `mappa` nella fixture (una per forma) con testi al limite.

- [ ] **Step 1: test che falliscono.**
  - Validazione: `percorso` con 1 luogo dà errore, `punto` con 2 luoghi dà errore, una forma sconosciuta dà errore, un
    luogo da 21 caratteri dà errore.
  - Piantina:
    - lo stesso seme dà lo stesso disegno, due semi diversi danno disegni diversi;
    - tutte le coordinate stanno in [0, 1000].
  - Piano: ordine `piantina < segno ≤ luoghi[0]`, tutto entro `durata - 8` con `durata` 36.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** implementazione.
- [ ] **Step 4:** `npm test` → verde.
- [ ] **Step 5:** impaginazione `--scene=mappa --passo=5` nei 4 stili, pulita.
- [ ] **Step 6: commit.** `feat: ✨ add the mappa scene with a generic street plan`

### Task 6: prompt, esempi, fixture di matrice, documentazione

**Files:**
- Modify: `agent-video.md`:
  - la tabella delle scene con `simbolo`, `passi`, `flusso` e `mappa`: campi e «quando»;
  - i limiti nuovi;
  - l'elenco dei pittogrammi;
  - la regola 15 con esempi di frasi che chiedono le scene nuove: un requisito fisico → `simbolo`; una procedura →
    `passi`; una catena causa-effetto o un passaggio fra servizi → `flusso`; un luogo, una zona, un tragitto → `mappa`;
  - gli esempi riscritti, con le stesse frasi dette dove possibile: **solo uno dei quattro usa `allarme`** (il
    secondo, Fascicolo, dove la notifica è vera), e insieme mostrano tutte e quattro le scene nuove. Per esempio,
    Windows: `allarme` → `simbolo` scudo barrato, `checklist` → `passi`; corta Fascicolo: `allarme` → `flusso`;
    Maps: `allarme` → `simbolo` segnale, `confronto` → `mappa` punto o area.

  Ogni esempio deve passare `validaStoryboard` ed `erroriVarieta` (≤ metà su dispositivo) nella sua durata.
- Modify: `fixtures/matrice.py` per generare anche i quattro tipi nuovi, con testi corti e al limite; rigenera le
  `matrice-NN`.
- Modify: `fixtures/README.md` e `README.md`, se elencano i tipi di scena.
- Modify: lo spec, con le eventuali decisioni prese durante la costruzione.
- Test: un test, in `src/storyboard/esempi.test.ts` o accanto ai test del prompt se esistono, che estrae i blocchi JSON
  di `agent-video.md` e li valida, varietà compresa. Che `agent-video.md` resti valido diventa un test.

- [ ] **Step 1:** il test sugli esempi, che fallisce sugli esempi attuali (4 `allarme` su 4, e la regola del
  dispositivo).
- [ ] **Step 2:** riscrivi prompt ed esempi; `npm test` → verde.
- [ ] **Step 3:** matrice. Esegui `python3 fixtures/matrice.py`, poi `controlla-impaginazione` con `--passo=5`
  `--secondi=4` sulle matrici che contengono i tipi nuovi, in tutti e 4 gli stili. Deve uscire pulito.
- [ ] **Step 4: commit.** `feat: ✨ teach the script prompt the new scenes and keep its examples valid`
