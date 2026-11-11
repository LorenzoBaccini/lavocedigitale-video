# Scene senza schermi — design

## Perché

Guardando i quattro video di esempio di `feat/stili` l'autore ha notato elementi che tornano in ogni video anche quando
la frase chiederebbe di mostrare altro: **la notifica cerchiata** e **il telefono o il portatile sempre in scena**. Le
cause:

- il repertorio delle scene è fatto quasi solo di dispositivi e di fogli con testo;
- tutti e quattro gli esempi di `agent-video.md` usano `allarme`, e Claude li imita;
- il segno sulla notifica è sempre lo stesso: cerchio sulla riga dell'app più sottolineatura.

## Obiettivi

1. **A — la notifica diventa un'eccezione.**
   - Al massimo un `allarme` per video: la validazione scarta il copione e la riprova gratuita lo corregge.
   - Il prompt dice che `allarme` serve solo quando l'articolo parla di un messaggio che il sistema o un'app mostrano davvero.
   - Negli esempi del prompt solo uno su quattro usa `allarme`.
   - Il segno sulla notifica cambia per slug: `cerchio` (come oggi), `sottolinea` (solo le righe del messaggio) o `nessuno`.
2. **B — quattro scene nuove, senza dispositivi.** Sono 2D, disegnate su `Foglio`, quindi funzionano nei quattro stili
   (carta, poster, griglia, scheda), senza dipendenze nuove:
   - `simbolo`: un pittogramma grande, disegnato a tratto, con la parola chiave; facoltativamente barrato.
   - `passi`: da 2 a 4 passaggi numerati, ciascuno con un pittogramma facoltativo.
   - `flusso`: da 2 a 3 nodi collegati da frecce (A → B → C), ciascuno con un pittogramma facoltativo.
   - `mappa`: una piantina generica (nessuna geografia reale) con un `punto`, un'`area` o un `percorso`, e le etichette
     dei luoghi.
3. **Al massimo metà delle scene di un video su un dispositivo**: la validazione lo fa rispettare.

## Non obiettivi

- Nessuna mappa vera, nessun dato geografico, nessun servizio esterno: la piantina è un disegno astratto.
- Nessuna scena 3D nuova.
- Il resto della pipeline (somiglianza, budget, storico) non cambia.

## Decisioni

- **Scene su un dispositivo**:
  - sempre `gancio`, perché sul set il portatile c'è sempre, `allarme`, `rischio` e `telefono`;
  - `oggetto` solo con `oggetto` uguale a `portatile` o `smartphone`.

  La chiusura è esclusa dal conto. Il limite è `ceil(n / 2)`, con `n` le scene senza la chiusura. Con una durata corta
  (3 scene) ne restano 2 su dispositivo.
- **Il segno della notifica** è un nuovo campo di `Dettagli`, `segnoNotifica`, scelto con
  `improntaMescolata(slug:segno) % 3`. `DETTAGLI_BASE` resta su `cerchio`, così la regressione a pixel di scrivania non
  cambia. Vale per `Allarme` (set 3D) e `AllarmeSchermo`.
- **I pittogrammi** sono un insieme chiuso. L'elenco sta in `src/storyboard/tipi.ts` come `SIMBOLI`:
  lucchetto, batteria, wifi, segnale, posizione, altoparlante, documento, euro, calendario, scudo.

  Il disegno sta in `src/editoriale/pittogrammi/`: tracciati SVG in un riquadro 100×100, tracciati a mano sulla voce.
  Nessun marchio.
- **Le quattro scene nuove sono su carta**: entrano in `SU_CARTA`, così sottotitolo e logo passano all'inchiostro.
- **Limiti dei campi**:

  | campo | limite |
  |---|---|
  | `passo.testo` | 28 |
  | `nodo.testo` | 18 |
  | `luogo` | 20 |
  | `passi` | 2–4 |
  | `nodi` | 2–3 |
  | `luoghi` | 1 con `punto` e `area`, 2 con `percorso` |
  | `titolo` di `simbolo` e `mappa` | 24, come gli altri titoli |
- Le cifre dei campi nuovi passano per il controllo delle cifre come quelle delle altre scene.

## Decisioni prese durante la costruzione

- **Regola «16 bis»**: il tetto delle scene su un dispositivo è una regola nuova del prompt fra la 16 e la 17, per non
  rinumerare le regole citate altrove.
- **`--segno=cerchio|sottolinea|nessuno`** in `controlla-impaginazione.ts` forza il segno della notifica, come gli altri
  flag dei dettagli; un valore sconosciuto è un errore.
- **Fixture rese accettabili dalla pipeline**, con le stesse frasi dette: in `durata-corta` e `durata-lunga` un
  `rischio` è diventato prima un `numero` e poi, quando c'erano le scene nuove, un `simbolo` (un `numero` senza cifre
  non era credibile, e le cifre di queste fixture devono stare nell'articolo di prova di Windows); in `chiusura-corta`
  il `rischio` è diventato un `simbolo` (euro barrato), e la scena prima della chiusura resta l'allarme 3D sul telefono.
- **Due fixture per le scene nuove**: `scene-nuove` arriva a 8 frasi, il tetto di `media`, quindi le tre `mappa` stanno
  in `scene-nuove-2`. Le matrici le provano in `matrice-11`…`-13`, un gruppo a parte, così le matrici di prima non
  cambiano.
- **Il primo passo non aspetta la voce**: entra al frame 2, perché il testo sia intero prima dello stacco anche nelle
  scene di un secondo; i passi dopo arrivano quando la voce li dice.
- **Il posto del pittogramma si riserva** in `passi` e `flusso` se almeno una riga ne ha uno: i testi partono tutti dallo
  stesso bordo.
- **Tratti a mano condivisi** in `tratto.ts`: `riquadro` (i nodi del flusso e la cornice della mappa), `freccia`,
  `tratteggio` (il tragitto) e `smussa` (le curve del tragitto).
- **`flusso`**: riquadri larghi quanto lo spazio fra i margini; l'ultimo nodo, dove la catena arriva, ha il tratto
  nell'accento.
- **`mappa`**: la piantina nasce da un seme (`etichetta` + `titolo`), con un fiume solo in alcune; il lato si calcola
  lasciando sempre il posto a due righe di titolo, così un titolo che va a capo non scende sul sottotitolo. La colonna
  segue `allineaFlesso`: centrata negli stili centrati, al margine sinistro negli altri. Le etichette dei luoghi stanno su
  una pillola del colore del foglio, dentro la cornice.
- **Titolo di `simbolo` e `mappa` dal piano**: le parole del titolo si costruiscono nel piano (`paroleTitolo` + `entroIl`
  a `durata − 12`, come `rischio` e `allarme`) e la scena le mostra così come sono, perché il testo dichiarato intero
  sia quello che si vede sul fotogramma fermo. In `mappa` i tempi non si invertono nemmeno sotto i 22 frame
  (`luoghi[1] ≥ luoghi[0]`, `titolo ≥ segno`). `passi` e `flusso` condividono l'algoritmo delle entrate
  (`entrateConVoce`), che differisce solo per la distanza minima.
- **Limite noto, `segnoNotifica`**: il piano dell'`allarme` conta gli eventi di cerchio e sottolineatura anche quando il
  segno manca, perché non vede i `Dettagli`; con `nessuno` un allarme può avere uno stacco di camera in meno.
- **Gli esempi del prompt**: in Windows lo scudo barrato va sulla frase «nasce senza difese» (il `rischio` passa alla
  frase del problema) e la `checklist` resta, perché dice cosa serve; i `passi` vanno alla procedura dei Consensi nel
  Fascicolo medio, l'unico con `allarme`. Il test degli esempi resta in `durata.test.ts`, che già li estraeva.
- **Tempo di lettura** (`lettura.ts`): ogni testo a schermo resta intero almeno `lettura(testo)` prima dello stacco,
  da 1,2 s (fino a 12 caratteri) a 1,8 s (0,6 s + 0,05 s a carattere), al più metà scena sotto i 3,6 s; se la voce lo
  porterebbe più tardi il testo la anticipa, mai il contrario. Vale in tutti i piani; nelle sequenze (`inSequenza`)
  ogni elemento lascia la sua distanza minima a quelli dopo, e sotto i 2,3 s possono vincere le distanze.
