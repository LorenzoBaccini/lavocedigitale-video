# lavocedigitale-video

Il generatore dei video verticali di [La Voce Digitale](https://lavocedigitale.it): da un articolo
appena pubblicato a un Reel 9:16 (1080×1920, 30 fps, 25-35 s) per Facebook e X.

Remotion + three.js per le scene, `claude -p` per il copione, ElevenLabs per la voce, Node 22 con
`--experimental-strip-types` (niente build, niente `typescript` fra le dipendenze).

## Come si prova in locale

```
npm ci
npm test                 # test unitari, nessuna chiamata esterna
npm run studio           # Remotion Studio sulla fixture windows10
```

Gli still del controllo d'impaginazione su una fixture (servono i suoni, generati una volta):

```
node --experimental-strip-types suoni/foley.ts
node --experimental-strip-types pipeline/controlla-impaginazione.ts fixtures/tutte-le-scene.storyboard.json out/still
```

Prima di cambiare una scena, il controllo esaustivo sulla matrice (ogni tipo di scena per ogni dispositivo e
schermata, testi corti e al limite; le fixture si rigenerano con `python3 fixtures/matrice.py`): un fotogramma ogni 5,
frasi da 4 s, le ganci con le tre aperture. Deve uscire pulito per tutte (vedi `fixtures/README.md`).

```
for f in fixtures/matrice-*.storyboard.json; do
  node --experimental-strip-types pipeline/controlla-impaginazione.ts $f out/matrice --passo=5 --secondi=4
done
```

La pipeline intera vuole le chiavi dei servizi; con `--prova` non scrive su S3 e non posta:

```
node --experimental-strip-types pipeline/main.ts articolo.json --prova
```

`articolo.json` è l'articolo come lo manda il sito:

```json
{ "slug": "…", "titolo": "…", "sottotitolo": "…", "testo": "corpo in testo semplice", "url": "https://lavocedigitale.it/<categoria>/<slug>", "tags": ["…"] }
```

## Come parte

Il sito, alla prima pubblicazione di un articolo (non le guide), lancia il workflow
`.github/workflows/video-social.yml` con `workflow_dispatch` su `main`: input `articolo` (il JSON
qui sopra, testo già senza HTML e accorciato dal sito sotto il limite di 65.535 caratteri degli input)
e `prova=false`. Il token del sito ha soltanto **Actions: write** su questo repo: lancia i run, non
scrive codice. Il workflow scrive l'articolo su file e lancia `pipeline/main.ts`. A mano si lancia
uguale (`prova` è accesa di default), per esempio con `articolo.json` dall'artifact di un run:

```
gh workflow run video-social.yml -f articolo="$(cat articolo.json)" -f prova=true
```

Un video alla volta: GitHub tiene un solo run in attesa, e un terzo lancio mentre uno gira e uno
aspetta annulla quello in attesa senza avviso.

Il workflow gira nell'environment `produzione`: lì stanno i segreti, e AWS si raggiunge via OIDC
con un ruolo che può solo leggere e scrivere `video/*.mp4` e lo storico nel bucket delle immagini.
Nessuna chiave fissa, nessun ID di account nel repo.

## Cosa fa la pipeline

0. **Storico** (`pipeline/storico.ts`): `video-storico.json` nel bucket, fuori dal prefisso `video/`
   che scade dopo 7 giorni. Tiene le sequenze di scene e le varianti degli ultimi 10 video e gli
   slug degli ultimi 200 pubblicati. Se non si legge, il video salta (in prova si va avanti). Un
   video già nello storico o ancora su S3 non si rifà.
   Subito dopo si sceglie la **variante** (`src/editoriale/variante.ts`): dipende solo dallo slug e
   dallo storico, quindi viene prima dello storyboard (che dovrà scrivere nella sua durata). Vedi
   [Varianti e stili](#varianti-e-stili).
1. **Storyboard** (`pipeline/storyboard.ts`): `claude -p` con `agent-video.md` e le sequenze degli
   ultimi 5 video. Schema (`src/storyboard/valida.ts`), varietà (`erroriVarieta`) e cifre
   (`src/storyboard/cifre.ts`: ogni numero deve stare nell'articolo) sono un solo controllo, con un
   ritentativo. La CLI gira senza strumenti, senza MCP, con modello fissato, con un ambiente ridotto
   (nessun segreto del job) e in una cartella temporanea; l'articolo sta fra `<articolo>` e
   `</articolo>`, dichiarato materiale e non istruzioni.
2. **Voce** (`pipeline/voce-elevenlabs.ts`): una sola chiamata all'endpoint `with-timestamps`;
   `pipeline/allineamento.ts` ricava le parole e le assegna alle frasi, ffmpeg taglia una clip per
   frase. Se ElevenLabs fallisce il video salta: nessuna voce di riserva.
3. **Controllo d'impaginazione** (`pipeline/controlla-impaginazione.ts`): fotogrammi a inizio, metà
   e fine di ogni frase; `src/impaginazione.ts` segnala testo fuori dai margini, sul logo, sulla zona
   del sottotitolo o a cavallo di uno schermo 3D. Se c'è un problema il video salta. Le scene con testo
   sopra e sotto un oggetto 3D (rischio, telefono) tengono l'oggetto nella fascia in ogni fotogramma con
   `fraLeQuote` (`src/editoriale/set/geometria.ts`); i titoli animati appoggiati in basso partono da
   `FONDO_TITOLO`, che lascia il posto all'entrata delle parole; le note a mano scendono di corpo, e poi
   si spostano, perché la parola più lunga stia nel margine, ma mai oltre 20 px a sinistra del punto indicato (`src/editoriale/set/nota.ts`): per questo `indica` e le note dei pezzi non hanno parole oltre 15 lettere (`LIMITI.parolaNota`).
4. **Render** (`pipeline/render.ts`): Remotion in `swangle`, con la variante scelta all'inizio.
5. **S3**: `video/<slug>.mp4` nel bucket delle immagini, servito su
   `https://lavocedigitale.it/images/video/<slug>.mp4`. Poi lo storico, prima dei post: se non si
   scrive, non si posta.
6. **Post**: Reel su Facebook (`pipeline/canali/facebook.ts`), X via Buffer
   (`pipeline/canali/buffer.ts`) con il testo di `pipeline/post-video.ts` (la domanda del gancio, il
   link, gli hashtag, nei 280 caratteri di X). Poi il resoconto di solo testo su Telegram privato.

Ogni errore chiude il job con il resoconto su Telegram; se il job cade fuori da node (setup,
timeout, annullamento) lo manda l'ultimo step del workflow. Un video alla volta
(`concurrency: video-social`).

## Varianti e stili

Ogni video ha una variante con otto dimensioni: `musica`, `luce`, `apertura`, `stile`, `gancio`,
`chiusura`, `fraseFinale`, `durata`. La pipeline la sceglie deterministica dallo slug (FNV-1a), fra i
valori non usati dagli ultimi video dello storico. Quanti video escludono dipende dalla dimensione
(`PROFONDITA`): `stile` e `gancio` gli ultimi 2 (non una rotazione fissa, che diventerebbe un ciclo
riconoscibile), `chiusura`, `fraseFinale` e `durata` l'ultimo, `musica`, `luce` e `apertura` n-1 (in n
video di fila passano tutte). Nello storico una voce senza `stile` vale `scrivania`: i video pubblicati
prima degli stili lo erano. Per le altre dimensioni nuove un valore assente non esclude niente.

La pipeline sceglie solo fra i valori di `ATTIVI`: uno stile, un gancio, una chiusura o una durata si
aggiungono lì quando sono costruiti e passano il controllo d'impaginazione, non prima. Se i valori
attivi sono meno dei video da escludere, la memoria si accorcia un video alla volta (l'ultimo valore resta
escluso finché ce n'è un altro); con un solo valore attivo si ripete. `fraseFinale` resta sulla frase di
base finché la pipeline non sostituisce davvero l'ultima frase del copione. `DIMENSIONI` tiene
invece tutti i valori validi: le props e il controllo d'impaginazione possono forzarne uno qualsiasi.
`VARIANTE_BASE` è il video approvato (`scrivania`, `scena`, `cartolina`, `media`): lo ha chi non dichiara
una variante, come le fixture.

Lo stile (`src/editoriale/stili/`) è l'aspetto al di là del contenuto: colori, caratteri, trattamento del
sottotitolo (sopra il set e sopra le scene grafiche, con una pillola facoltativa), allineamento dei
titoli, grana, vignettatura, transizione. Scene, Overlay, Foglio, occhielli e note lo leggono con
`useStile()`; nessuna scena scrive un colore o un carattere. Restano fuori dallo stile i materiali del
set 3D (`set/luci.ts`, `Portatile.tsx`, oggetti) e i disegni degli schermi (`set/disegni.ts`, che usano
il carattere delle interfacce `SANS_SCHERMI`): un nuovo set li sostituisce in blocco. Come la variante,
il contesto dello stile non attraversa il `ThreeCanvas`: dentro la scena 3D va passato come prop. Gli
stili non ancora costruiti puntano ai token di `scrivania` in `STILI`, e la pipeline non li sceglie.

Lo stile sceglie anche il set e il fondo delle grafiche: le scene montano `Set3D`, che legge lo stile fuori dal
canvas e monta `Scrivania`, `Fondale` o `Notturno` (`set: "scrivania" | "fondale" | "notturno"`); `Foglio` monta il
foglio di carta, il `Poster` o la `Griglia` (`grafiche: "carta" | "poster" | "griglia"`). Titoli e occhielli seguono `allineamentoTitoli` anche dentro le scene
(`allineaTesto`, `allineaFlesso`). `colori.velo` tinge il velo sopra il set; `colori.suChiaro` e
`colori.segnoSuChiaro` sono il testo e il barrato sopra una superficie chiara del set (la pagina sullo schermo,
le opzioni del telefono).

**studio** (`stili/studio.ts`): limbo curvo a tinta unita (`set/limbo.ts` il profilo), luce da softbox quasi a
picco con ombre corte, riempimento frontale, niente taccuino; poster a tinta piena con un disco tono su tono;
Space Grotesk, titoli a sinistra, testo bianco; sottotitolo in una pillola scura (bianco e chiave gialla, oltre
4,5:1 sopra qualunque fondo, `studio.test.ts`). La tinta (cobalto, salvia, terracotta, senape, lavanda) dipende
solo dallo slug (`tintaDi`, `stileDelVideo` in `Notizia`): non è nella variante e non entra nello storico. I toni
dello spec sono scuriti quanto basta per il testo bianco (3:1, soglia del testo grande: ogni testo è sopra i 34 px;
`studio.test.ts` prova ogni colore di testo del poster e del set, tenui e accenti compresi, su ogni tinta), che sul set passa
sopra il fondale e sopra i dispositivi scuri. Transizione `spinta`: la scena resta montata 10 frame dopo la sua
fine mentre la seguente entra da destra e la spinge fuori (`editoriale/transizione.ts`), voce e suoni restano
sulle durate di sempre. Il controllo d'impaginazione la spegne: misura ogni scena ferma al suo posto.

**notte** (`stili/notte.ts`): set `Notturno` quasi buio, un piano scuro satinato (rugosità 0,38, un po' metallico:
riflette morbido le luci colorate) largo abbastanza da perdersi nel nero, due spot di taglio da dietro (ciano a
sinistra con l'unica ombra, magenta a destra), un riempimento frontale debole, una luce puntiforme davanti allo
schermo che illumina tastiera e piano, e un Environment con due strisce ciano e magenta per i riflessi. Niente
riflessi in tempo reale, niente taccuino. Grafiche: `Griglia`, nero con una griglia ciano al 9 % e una macchia di
luce ciano in un angolo diverso per tipo di scena. JetBrains Mono per titoli e testi; i testi sulle grafiche
hanno il bagliore ciano dello stile (`bagliore`, il `text-shadow` dei titoli sulle grafiche e del contenitore della
griglia, che i testi ereditano; `none` negli altri stili). Il sottotitolo resta Inter (`carattere` del trattamento):
si legge in un attimo anche dove il mono sarebbe largo. Il mono è circa il 20 % più largo di Lora e Inter: `larghezza: 1.2`
nello stile, e `corpo` (in `anim.ts`) divide per questo i corpi che calcola dalla lunghezza del testo, come il
gancio i suoi corpi minimi; negli altri stili vale 1 e i corpi restano quelli di prima. Senza, il controllo
d'impaginazione trovava titoli sopra telefono e pagina, numero e valori del confronto oltre i margini. Chiave ciano accesa (`bagliore` del trattamento, solo sulla
parola chiave) dentro una pillola quasi nera dagli angoli stretti: sopra uno schermo bianco il testo resterebbe
illeggibile, con la pillola testo e chiave superano 4,5:1 su bianco, nero e fondi (`notte.test.ts`, che prova anche
≥ 3:1 per ogni colore di testo delle grafiche, tenui e accenti compresi, sul nero e sotto la macchia ciano, e i
colori del set sul velo e sul fondo). Sopra lo schermo chiaro il barrato è magenta scuro (il ciano sparirebbe).
Titoli centrati. Transizione `lampo`: sul primo frame di ogni scena tranne la prima un velo bianco all'82 % che
in 6 frame si spegne virando al ciano (`lampo` in `editoriale/transizione.ts`, `Lampo.tsx`): un solo `div`, niente
scene doppie. Il controllo d'impaginazione lo spegne come la spinta.

Il controllo d'impaginazione forza le dimensioni con `--stile= --gancio= --chiusura= --durata=` (un valore
sconosciuto è un errore; uno valido ma non ancora in `ATTIVI` dà un avviso, perché il fotogramma mostra
ancora quello di base) e con `--variante=luce:sera,apertura:alta`:

```
node --experimental-strip-types pipeline/controlla-impaginazione.ts fixtures/matrice-03.storyboard.json --passo=5 --secondi=4 --stile=studio
```

## Rifare in locale un video del runner, senza ripagare

Ogni run carica l'artifact `video-<run id>` (3 giorni): articolo, risposte di Claude, storyboard,
props, `voce.mp3`, `allineamento.json`, `timing.json` e, in prova, l'mp4.

```
gh run download <run id> -n video-<run id> -D out/runner
mkdir -p public/audio/<slug> out/<slug>
cp out/runner/<slug>/audio/* public/audio/<slug>/
cp out/runner/<slug>/storyboard.json out/runner/<slug>/props.json out/<slug>/
node --experimental-strip-types pipeline/voce-elevenlabs.ts out/<slug>/storyboard.json public/audio/<slug> --riusa
node --experimental-strip-types suoni/foley.ts
node --experimental-strip-types pipeline/controlla-impaginazione.ts out/<slug>/props.json --passo=15
node --experimental-strip-types pipeline/render.ts out/<slug>/props.json out/<slug>/<slug>.mp4
```

`--riusa` rifà clip e timing da `voce.mp3` e `allineamento.json` senza chiamare ElevenLabs.

## Dove sta cosa

- `agent-video.md`: le istruzioni del copione (il prompt dello storyboard).
- `src/`: la composizione Remotion; `src/editoriale/` il sistema comune (set, carta, segni, piani
  delle scene), `src/scenes/` le scene.
- `pipeline/`: dall'articolo al post; `pipeline/canali/` i client di Telegram, Facebook e Buffer.
- `suoni/`: foley e sottofondo musicale sintetizzati, generati fuori da git.
- `fixtures/`: storyboard e timing di prova (vedi `fixtures/README.md`).
- `public/fonts/`: Inter, Lora, Space Grotesk e JetBrains Mono, SIL Open Font License (`OFL-*.txt`). L'elenco unico è `src/caratteri.ts`:
  ne derivano sia i `@font-face` del render sia il precaricamento del controllo d'impaginazione.
