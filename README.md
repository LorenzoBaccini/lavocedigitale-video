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
il contesto dello stile non attraversa il `ThreeCanvas`: dentro la scena 3D va passato come prop.

I tre set condividono il guscio `set/Palco.tsx` (fondo, canvas con le ombre, camera); ognuno ci mette dentro
luci, piano e dispositivi. Lo stile sceglie anche il set e il fondo delle grafiche: le scene montano `Set3D`, che legge lo stile fuori dal
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
nello stile, e `corpo` (in `anim.ts`) divide per questo i corpi che calcola dalla lunghezza del testo e il suo
`minimo`; `altezzaRighe` (`editoriale/titoli.ts`), che stima le righe dei titoli prima del fotogramma per piazzare
camera e oggetti, moltiplica per lo stesso fattore la larghezza media del carattere. Negli altri stili vale 1 e
corpi e stime restano quelli di prima. Senza, il controllo
d'impaginazione trovava titoli sopra telefono e pagina, numero e valori del confronto oltre i margini. Chiave ciano accesa (`bagliore` del trattamento, solo sulla
parola chiave) dentro una pillola quasi nera dagli angoli stretti: sopra uno schermo bianco il testo resterebbe
illeggibile, con la pillola testo e chiave superano 4,5:1 su bianco, nero e fondi (`notte.test.ts`, che prova anche
≥ 3:1 per ogni colore di testo delle grafiche, tenui e accenti compresi, sul nero e sotto la macchia ciano, e i
colori del set sul velo e sul fondo). Sopra lo schermo chiaro il barrato è magenta scuro (il ciano sparirebbe).
Titoli centrati. Transizione `lampo`: sul primo frame di ogni scena tranne la prima un velo bianco all'82 % che
in 6 frame si spegne virando al ciano (`lampo` in `editoriale/transizione.ts`, `Lampo.tsx`): un solo `div`, niente
scene doppie. Il controllo d'impaginazione lo spegne come la spinta.

**schermo** (`stili/schermo.ts`): niente 3D. Lo stile ha `set: "schermo"` e in `Notizia` le sei scene che negli altri
stili montano `Set3D` (gancio, allarme, oggetto, rischio, telefono, documenti) sono sostituite dalle loro rese a tutto
quadro in `editoriale/schermo/` (`SCENE_SCHERMO`); le scene grafiche restano quelle comuni. `Set3D` lancia un errore se
lo stile è schermo: un `ThreeCanvas` montato per sbaglio non passa inosservato, e `schermo.test.ts` segue il grafo
degli import (quelli che portano codice, non `import type`) a partire da ogni file della cartella e verifica che non
arrivi mai a `@remotion/three`, a `@react-three/*`, a `src/scenes/` né ai componenti del set (`Set3D`, `Palco`,
`Portatile`, gli oggetti); controlla anche che ogni scena con `<Set3D` abbia la sua resa. `three` resta raggiungibile:
è la matematica dei vettori che usano i piani delle scene, comuni a tutti gli stili, non un canvas. Le rese riusano i
piani (`piani/`, tempi, testi e suoni identici) e i titoli delle scene del set, che per questo stanno fuori dalle scene,
in `editoriale/testate/` (`titoloGancio`, `titoliAllarme`, `titoliRischio`, `titoliOggetto`, `titoloTelefono`,
`titoloDocumenti`): cambia solo cosa sta sotto i titoli.

Sotto i titoli c'è lo schermo, da bordo a bordo: `Schermata` mostra un disegno (in pixel suoi) dentro un riquadro del
fotogramma, inquadrato da una `Ripresa` (il punto del disegno da mettere al centro e la scala; `schermo/vista.ts`,
puro e provato). La vista non mostra mai oltre il bordo del disegno del portatile; il telefono, che ha i bordi a
tinta unita, la camera lo inquadra libera e il fondo del riquadro ne continua il colore. I disegni sono quelli delle
texture del set (`set/disegni.ts`, `set/oggetti/disegni.ts`; la scelta dello schermo del portatile ora sta in
`set/schermata.ts`, condivisa con `Portatile`), dipinti su un canvas 2D (`Disegno`, una volta per contenuto, quando
i font sono pronti; il telefono a 2× perché a tutto quadro è ingrandito). La camera scorre e zooma fra due riprese
(`fraRiprese`: punto in linea retta, scala in proporzione) e gli stacchi in asse la stringono come sul set. Il
riquadro intero è l'ingombro pieno per il controllo d'impaginazione: i titoli stanno sopra e sotto, mai sopra lo
schermo. Per questo le quote dei titoli con la parola del colpo, a sinistra, contano anche la riserva del colpo
(`larghezzaRiga` in `Titolo.tsx`, usata da `testate/quote.ts`: `fineTitoloAlto`, `inizioTitoloBasso`): senza, il
titolo andava su due righe e finiva sopra lo schermo. La sottolineatura e il barrato a pennarello fra due punti del
fotogramma sono `trattoFra` (`editoriale/tratto.ts`), lo stesso nelle scene del set e nelle rese a tutto quadro.

Scena per scena: nel gancio lo schermo (pagina, desktop, telefono bloccato o l'oggetto) quasi fermo, poi sulla chiave
la camera stringe sul titolo della pagina o sul punto caldo; prima di un allarme la notifica scende al suo posto
(`NotificaSchermo`) e la camera va da lei. Nell'allarme la notifica in primo piano fra sopratitolo e titolo, con il
cerchio bianco e la sottolineatura nel blu chiaro (cadono sulla notifica scura). Nell'oggetto su `indica` il
puntatore (`Puntatore`, `schermo/tocco.ts`: viaggio di 14 frame, tocco sul frame d'arrivo, onda dell'accento di 16)
va al pulsante, alla riga evidenziata del telefono (lì col dito, un cerchio grigio) o al punto caldo dell'oggetto,
mentre la camera stringe; sugli oggetti senza schermo il richiamo di `indica` sta sotto il riquadro. La conferma è
un avviso bianco dentro lo schermo, in basso, con la spunta nell'accento (`ConfermaSchermo`, testo segnato su chiaro):
lo schermo non si accorcia per farle posto. Chiavetta, router e carta sono schede illustrate piatte (`Illustrazioni.tsx`, gli
stessi colori e dettagli degli oggetti 3D). Nel rischio la camera si allontana e sulla chiave lo schermo si spegne
del 40 %. Nel telefono le opzioni stanno sempre intere fra i titoli e i sottotitoli, barrato e cerchio come sul set.
Nei documenti i pezzi sono schede piatte in colonna sul grigio (tessera, documento e lettera del PIN dai disegni
del set, il lettore illustrato), ognuno il suo ingombro, le note a destra come sul set.

Grafiche: `Scheda` (`grafiche: "scheda"`), una scheda d'interfaccia bianca dagli angoli tondi sul grigio chiaro
`#eceef2`, fra il logo e i sottotitoli. Inter per titoli e testi, testo `#15181d`, tenue `#555d6b`, accento blu di
sistema `#0a63d6` (scurito per stare a 4,5:1 anche sul grigio), timbro e barrato rossi. Sottotitolo scuro in una
pillola bianca opaca, chiave blu (`schermo.test.ts`: testo e chiave oltre 4,5:1, ogni colore di testo oltre 3:1 su
scheda e grigio). Niente ombre sui testi, niente vignettatura, grana leggera. Titoli a sinistra come lo studio, ma la
transizione è lo `scorrimento`: la stessa spinta di 10 frame in verticale (`Spinta` con `verticale`), la scena nuova
sale da sotto come in un feed; il controllo d'impaginazione la spegne come le altre.

### I ganci

Il primo secondo decide se si scorre via: il gancio (`variante.gancio`) cambia il primo fotogramma, in ogni stile.
La scena del gancio (`scenes/Gancio.tsx` sul set, `schermo/GancioSchermo.tsx` a tutto quadro) sceglie la resa dalla
variante; tempi, testi, suoni e sottotitolo restano quelli di `piani/gancio.ts` per tutti e quattro, quindi la
ridondanza del sottotitolo non cambia. Il formato vale per ogni scena `gancio`: il copione la mette sempre in
apertura (`agent-video.md`), le fixture con più ganci li provano tutti.

- **scena**: quello di prima, pixel per pixel.
- **parola** (`ganci/Parola.tsx`, `testate/parola.ts`): niente set, niente oggetto. La frase detta a tutta pagina
  sulla superficie delle grafiche dello stile (`Foglio`: carta, poster, griglia, scheda), centrata in verticale fra
  `TITOLO_TOP` e `FONDO_TITOLO`, ogni parola entra a tempo con la voce (gli stessi tempi del titolo di sempre). La
  chiave è almeno 1,6 volte il resto e sottolineata. I corpi partono grandi e calano finché la stima delle righe
  (`altezzaRighe`) sta nell'82 % della fascia; nessuna parola supera la riga da sola (`emDi`: 0,58 em a lettera,
  0,74 le maiuscole, per la larghezza dello stile). L'oggetto non compare mai: lo spec ammette «o mai», e un oggetto
  piccolo nell'ultimo terzo vorrebbe dire un secondo canvas 3D e un titolo che si sposta. Sopra la parola logo e
  sottotitolo prendono l'inchiostro delle grafiche (`Overlay`).
- **dettaglio** (`ganci/dettaglio.ts`): si apre su un primo piano stretto e si allarga fino alla scena del gancio.
  Il dettaglio dipende dal contenuto: la notifica se arriverà un allarme (allora c'è già dal primo fotogramma, e alla
  fine la camera ci torna come prima), il titolo della pagina, la barra del desktop, la scheda della schermata di
  blocco, o il punto caldo dell'oggetto. Sul set la camera parte in asse sul dettaglio (`primoPiano` in
  `set/inquadrature.ts`) e si allarga con `allarga` (distanza in proporzione, lo zoom sembra uniforme); a tutto quadro
  il riquadro parte dall'alto del fotogramma e scende sotto il titolo mentre la ripresa si allarga. 6 frame fermi, 22
  di allargamento: il titolo entra solo dopo (le parole dette prima arrivano insieme) e la spinta sulla chiave non
  comincia prima, perché a primo piano lo schermo copre tutto il quadro.
- **diviso** (`ganci/diviso.ts`, `ganci/Blocco.tsx`): la metà alta è un blocco nell'accento dello stile col titolo
  nella sua posizione di sempre; titolo e logo ci stanno nel colore dello stile che sull'accento contrasta di più
  (fondo, velo, superficie, testo, inchiostro: oltre 3:1 in ogni stile e tinta, `ganci.test.ts`). Dopo 10 frame il
  blocco sale fino alla quota sotto il titolo (lo schermo del portatile sale con il suo bordo; a tutto quadro la
  ripresa parte dal punto che conta), poi in 8 frame svanisce mentre il titolo torna del suo colore: entro 28 frame la
  scena è intera e il titolo non ha mai attraversato il bordo del blocco. Il blocco è un ingombro a bordo: il
  controllo d'impaginazione verifica che il titolo ci stia dentro intero.

Il controllo d'impaginazione misura solo i ganci con `--scene=gancio`; `fixtures/ganci-lunghi.storyboard.json` ha tre
domande da 64 caratteri con la chiave da 18 all'inizio, in mezzo e in fondo.

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
  delle scene, `schermo/` le scene del set rese a tutto quadro), `src/scenes/` le scene.
- `pipeline/`: dall'articolo al post; `pipeline/canali/` i client di Telegram, Facebook e Buffer.
- `suoni/`: foley e sottofondo musicale sintetizzati, generati fuori da git.
- `fixtures/`: storyboard e timing di prova (vedi `fixtures/README.md`).
- `public/fonts/`: Inter, Lora, Space Grotesk e JetBrains Mono, SIL Open Font License (`OFL-*.txt`). L'elenco unico è `src/caratteri.ts`:
  ne derivano sia i `@font-face` del render sia il precaricamento del controllo d'impaginazione.
