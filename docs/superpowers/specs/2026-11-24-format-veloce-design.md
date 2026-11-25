# Format veloce: video che tengono chi scorre — design

Data: 2026-11-24. Stato: approvato nelle scelte (strada B, voce di Nicola con tag, soluzione intera nel video, canali invariati).

## Perché

I 18 Reel pubblicati dal 6 novembre fanno ~200 visualizzazioni e **zero like e interazioni**. Diagnosi sui video
del 21-23 novembre (copioni, fotogrammi ogni 2 s):

1. **Il gancio è una domanda da motore di ricerca** («Il tuo Chromebook non si accende?»). Nel feed nessuno sta
   cercando: chi pensa «no» scorre. È quasi tutto il pubblico.
2. **Il primo fotogramma è fermo**: testo piccolo su fondo vuoto. Nel primo secondo non succede niente.
3. **Effetto presentazione**: una scheda ogni 4-5 s, tanto vuoto, scritte piccole; il set 3D è quasi fermo.
4. **La soluzione resta fuori** («il resto è nel link del post»): nei Reel il link nella descrizione non si
   clicca. Chi guarda resta senza niente e non ha motivo di mettere like o salvare.
5. **Nessun invito a reagire**: niente da commentare.
6. **La voce eleven_v3 è usata al minimo**: niente tag emotivi, niente impostazioni, ritmo costante (~2,35 parole/s).

## Obiettivi

- Primo secondo che ferma il pollice, anche senza audio (i Reel partono muti).
- Un cambiamento visibile almeno ogni ~1,5 s.
- Il video dà la soluzione intera: chi lo guarda impara qualcosa di utile e ha un motivo per salvarlo.
- Una domanda finale che chiede un commento facile.
- Voce recitata: tono che cambia frase per frase, ritmo più svelto.
- Video più corti: 12-30 s invece di 15-40.

## Non obiettivi

- Nuovi canali (IG Reels, YouTube Shorts): decisione dell'utente, restano FB + X.
- Nuovi servizi o spese: si resta a 0 € oltre a ElevenLabs. Niente stock, niente immagini generate.
- Dialogo a due voci, format a rotazione (strada C): eventuale passo successivo.

## Anti-obiettivi (fallimento anche se funziona)

- **Clickbait che mente**: il gancio forte resta vero. Valgono tutte le regole di fatto dell'articolo
  (cifre nell'articolo, condizioni che viaggiano col dato, nessun marchio nelle scene).
- Emoji, stickers, effetti da sagra: il ritmo viene da tagli, zoom e parole, non da decorazioni.
- Testo che esce dai margini o finisce sotto i sottotitoli: il controllo d'impaginazione resta bloccante.
- Render più lento oltre il timeout del job (90 min sul runner pubblico).

## Strade considerate

- **A. Ritocco** (ganci, tag, sottotitoli più grandi): veloce, ma resta l'effetto presentazione. Scartata.
- **B. Format veloce sul motore attuale** — **scelta**. Si riscrive il copione e si cambia la regia, tenendo
  scene, set 3D, validazioni, controllo d'impaginazione, storico e canali.
- **C. B + format a rotazione** (dialogo, mito/realtà, tre errori, POV): più varietà, circa il doppio del
  lavoro. Rimandata: si valuta dopo i numeri del format veloce.

## Il design

### 1. Copione (`agent-video.md`, `src/storyboard/`)

- **Gancio**: un'affermazione di al massimo 10 parole, non una domanda. Deve creare una posta in gioco o una
  curiosità, restando vera. La pipeline sceglie una **famiglia di gancio** per video, ruotata come le altre
  dimensioni della variante (`gancioTesto`), e il prompt la chiede:
  - `errore` — «Se il Chromebook non si accende, non fare questo.»
  - `segreto` — «Il Chromebook ha un ripristino che non cancella niente.»
  - `posta` — «Due ripristini su tre ti cancellano il disco.»
  - `smentita` — «Windows dodici non esiste. Ecco cosa c'è davvero.»
  - `situazione` — «Premi accensione. Schermo nero.»
  La validazione scarta un gancio con più di 10 parole o che finisce con «?».
- **Seconda frase**: la promessa («Ecco come lo riaccendi senza perdere niente»). È una regola del prompt, non
  viene validata.
- **Soluzione intera**: niente «il resto nell'articolo». La validazione scarta le parole «link» e «articolo»
  nelle frasi di contenuto.
- **Domanda finale** al posto della chiusura col link: una domanda a chi guarda, facile da commentare
  (sì/no, una scelta fra due, la propria esperienza). Al massimo 12 parole, termina con «?». La scrive Claude e
  sta nella scena `chiusura`. Spariscono `TESTO_CHIUSURA`, `FRASI_CHIUSURA` e la dimensione `fraseFinale`.
- **Tono**: ogni frase ha un `tono` da un elenco chiuso, che la pipeline converte in tag v3 in testa alla
  frase: `deciso` → nessun tag, `entusiasta` → `[excited]`, `curioso` → `[curious]`, `serio` → `[serious]`,
  `sussurrato` → `[whispers]`, `sorpreso` → `[surprised]`, `ironico` → `[sarcastic]`. Al massimo due frasi
  `sussurrato` o `ironico` per video. Il tag non entra mai nel `testo` dello storyboard: sottotitoli, cifre e
  controlli restano uguali.
- **Durate**, ricalibrate su ~2,6 parole/s (vedi voce):

  | durata | frasi (domanda inclusa) | parole dette | secondi circa |
  |---|---|---|---|
  | corta | 4-5 | 28-40 | 11-16 |
  | media | 5-7 | 40-56 | 16-22 |
  | lunga | 7-8 | 56-72 | 22-28 |

  Le parole contano tutte le frasi, domanda finale compresa (ora la scrive Claude).
- Restano tutte le altre regole: fatti solo dall'articolo, cifre controllate, nessun marchio nelle scene,
  varietà delle sequenze, tipi mai uguali di fila, al massimo metà delle scene su un dispositivo.

### 2. Voce (`pipeline/voce-elevenlabs.ts`, `pipeline/allineamento.ts`)

- Il testo inviato è il copione con il tag del tono davanti a ogni frase.
  **Verificato il 24/11**: con eleven_v3 i tag compaiono nell'`alignment` con un intervallo di tempo proprio.
  L'allineamento li toglie prima di formare le parole (un token `[...]` non è una parola).
- `voice_settings.stability`: 0,5 («natural») di base. Lo 0 («creative») si sceglie dopo aver ascoltato i
  campioni (vedi Verifica).
- **Ritmo**: l'mp3 intero si accelera a 1,1× con ffmpeg (`atempo`, gratis); i tempi dell'allineamento si
  dividono per 1,1. Poi il taglio per frase resta quello di oggi.

### 3. Regia (`src/`)

- **Sottotitoli cinetici** (`Overlay`, `sottotitoli.ts`): restano nella stessa fascia in basso (quella che il
  controllo d'impaginazione già protegge), ma con blocchi da 1-3 parole invece di 2-4, corpo più grande, la
  parola detta che si accende in quel momento e la chiave che entra con uno scatto e in colore d'accento.
  Leggibili a video muto.
- **Primo fotogramma vivo** (gancio): il testo del gancio è già intero al fotogramma 0, senza entrata, con uno
  zoom lento continuo; un colpo sonoro al fotogramma 0. Il fotogramma 0 è anche l'anteprima del Reel.
- **Spinta sulla chiave**: quando la voce dice la chiave, la scena ha uno scatto di scala (~1,04-1,06) con
  assestamento. Nelle frasi oltre ~2 s, un **taglio di zoom** a metà frase (stacco secco fra due scale vicine,
  il jump cut dei creator). Le scale restano piccole e il controllo d'impaginazione misura anche quei
  fotogrammi.
- **Mai fermi oltre 1,5 s**: `PAUSA_MAX` scende da 75 a 45 fotogrammi. La regola del secondo accento esiste
  già, la si stringe.
- **Stacchi con suono**: ogni cambio di frase ha una transizione rapida e un whoosh sintetizzato
  (`suoni/foley.ts`); la chiave ha un tick leggero.
- **Finale**: la domanda finale in grande con un invito a commentare animato (freccia verso il basso), ~1,5 s
  dopo l'ultima parola, poi il video finisce. Il dominio resta piccolo sotto. Niente cartolina lunga.

### 4. Post (`pipeline/post-video.ts`)

Prima il gancio, poi la domanda finale, poi il link e gli hashtag, nei 280 caratteri di X.
Chi legge la descrizione trova un invito a commentare, non solo un link.

### 5. Varianti e storico

- Nuova dimensione `gancioTesto` (5 famiglie, profondità 3: le ultime tre non si ripetono).
- Tolta `fraseFinale`. Lo storico vecchio senza i campi nuovi non esclude niente.
- `durata`: le stesse tre, con i limiti nuovi.

## Verifica

1. `npm test` verde, test nuovi per: tag fuori dall'allineamento, accelerazione dei tempi, validazione di
   gancio, domanda finale e toni, post.
2. Matrice d'impaginazione pulita su tutte le fixture (aggiornate al formato nuovo), compresi i fotogrammi
   con lo zoom.
3. **Tre video campione** in locale sugli articoli del 21-23 novembre (Chromebook, Windows 12, Windows 11
   non supportati): voce vera (~3 × 200 crediti), render completo. Fogli di provini vecchio/nuovo affiancati
   e mp4 all'utente. Stability 0 contro 0,5 su uno dei tre.
4. Tempo di render nel campione: deve stare sotto i 40 minuti sul runner (si misura alla prima corsa).

## Misura dopo il rilascio (PLAYBOOK)

Esperimento «format veloce» nel PLAYBOOK di La Voce Digitale: dopo 10 video, confronto con i 18 vecchi su
riproduzioni, like + commenti, tempo medio di visione. Il token della pagina non ha `read_insights`: o si
aggiunge il permesso (passo guidato con l'utente), o l'utente esporta da Meta Business Suite. Soglia fissata
prima: il format regge se almeno 5 video su 10 hanno almeno un'interazione e la mediana delle riproduzioni non
scende.

## Lasciato a chi costruisce

Curve e durate esatte di scatti, zoom e transizioni; i suoni del whoosh e del tick; i nomi interni; come
aggiornare le fixture della matrice.
