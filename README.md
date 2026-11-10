# lavocedigitale-video

Il generatore dei video verticali di [La Voce Digitale](https://lavocedigitale.it): da un articolo
appena pubblicato a un Reel 9:16 (1080×1920, 30 fps, 15-40 s secondo la durata) per Facebook e X.

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
   che scade dopo 7 giorni. Tiene le sequenze di scene, le varianti e le impronte degli ultimi 10 video e gli
   slug degli ultimi 200 pubblicati. Se non si legge, il video salta (in prova si va avanti). Un
   video già nello storico o ancora su S3 non si rifà.
   Subito dopo si sceglie la **variante** (`src/editoriale/variante.ts`): dipende solo dallo slug e
   dallo storico, quindi viene prima dello storyboard, che scrive nella sua durata. Vedi
   [Varianti e stili](#varianti-e-stili).
1. **Storyboard** (`pipeline/storyboard.ts`): `claude -p` con `agent-video.md`, la durata della
   variante (vedi [La durata](#la-durata)) e le sequenze degli ultimi 5 video. Schema (`src/storyboard/valida.ts`), varietà (`erroriVarieta`) e cifre
   (`src/storyboard/cifre.ts`: ogni numero deve stare nell'articolo) sono un solo controllo, con un
   ritentativo. La CLI gira senza strumenti, senza MCP, con modello fissato, con un ambiente ridotto
   (nessun segreto del job) e in una cartella temporanea; l'articolo sta fra `<articolo>` e
   `</articolo>`, dichiarato materiale e non istruzioni.
   Il copione finisce sempre con `TESTO_CHIUSURA` (lo pretendono prompt e validazione); subito dopo la
   validazione `conFraseFinale` (`src/storyboard/fraseFinale.ts`) mette al suo posto la frase finale della
   variante: voce, sottotitolo, storyboard dell'artifact e props vedono solo quella. Vedi [Le chiusure](#le-chiusure).
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
   Subito dopo, il **controllo di somiglianza** (`pipeline/somiglianza.ts`): se il video somiglia troppo a uno
   degli ultimi 3 cambia stile e gancio, con la stessa voce. Vedi [Il controllo di somiglianza](#il-controllo-di-somiglianza).
4. **Render** (`pipeline/render.ts`): Remotion in `swangle`, con la variante uscita dal controllo di somiglianza.
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
`chiusura`, `fraseFinale`, `durata`. La pipeline la sceglie deterministica dallo slug (FNV-1a con
rimescolamento finale, `improntaMescolata`), fra i
valori non usati dagli ultimi video dello storico. Quanti video escludono dipende dalla dimensione
(`PROFONDITA`): `stile` e `gancio` gli ultimi 2 (non una rotazione fissa, che diventerebbe un ciclo
riconoscibile), `chiusura`, `fraseFinale` e `durata` l'ultimo, `musica`, `luce` e `apertura` n-1 (in n
video di fila passano tutte). Nello storico una voce senza `stile` vale `scrivania`: i video pubblicati
prima degli stili lo erano. Per le altre dimensioni nuove un valore assente non esclude niente.

Senza il rimescolamento le dimensioni andavano di pari passo: con due valori liberi `% 2` guarda solo il
bit basso di FNV-1a, uguale per ogni chiave dello stesso slug, e su 300 video di fila uscivano 4 coppie
stile/gancio su 16. Oggi passano tutte (`variante.test.ts`, `impronta.test.ts`). La `chiusura` invece
alterna per scelta: due valori con l'ultimo escluso lasciano una sola possibilità. Lo stesso vale, con
un ciclo più lungo, per `musica`, `luce` e `apertura` (memoria n-1).

La pipeline sceglie solo fra i valori di `ATTIVI`: uno stile, un gancio, una chiusura o una durata si
aggiungono lì quando sono costruiti e passano il controllo d'impaginazione, non prima. Se i valori
attivi sono meno dei video da escludere, la memoria si accorcia un video alla volta (l'ultimo valore resta
escluso finché ce n'è un altro); con un solo valore attivo si ripete. `DIMENSIONI` tiene
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

Gli stili attivi sono quattro: `scrivania`, `studio`, `notte`, `schermo`.

**scrivania** (`stili/scrivania.ts`): il video approvato (con `DETTAGLI_BASE` identico pixel per pixel). Scrivania di rovere con due oggetti di scena (vedi [I dettagli](#i-dettagli)), fogli di carta per
le grafiche, Lora per i titoli e Inter per i testi, accento ambra, titoli centrati, transizione a taglio netto.

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

### La durata

La durata è l'unica dimensione che cambia il copione invece dell'aspetto: Claude non la sceglie, la pipeline gliela
chiede. Per questo la variante si sceglie prima dello storyboard (`pipeline/main.ts`) e `scriviStoryboard` riceve
`variante.durata` e `variante.fraseFinale`.

| durata | frasi (chiusura inclusa) | parole dette | secondi circa |
|---|---|---|---|
| corta | 4-5 | 32-46 | 15-21 |
| media | 6-8 | 50-72 | 23-32 |
| lunga | 8-9 | 72-88 | 32-40 |

I numeri stanno in un posto solo, `LIMITI_DURATA` (`src/storyboard/tipi.ts`). Il prompt li scrive da lì
(`sezioneDurata`, prima dell'articolo, anche nel ritentativo) e `validaStoryboard(storyboard, durata, fraseFinale)` li
applica. `agent-video.md` ha la stessa tabella perché Claude veda le tre durate e le regole di scrittura di ognuna
(regola 20), e quattro esempi (due medie, una corta, una lunga): `durata.test.ts` controlla che la tabella coincida con
`LIMITI_DURATA` e che ogni esempio passi nella durata che dichiara con ognuna delle tre frasi finali. `media` è la durata
di prima con il tetto delle parole sceso a 72, perché non si sovrapponga a `lunga` oltre il confine.

Le parole contate sono quelle dette: le frasi prima della chiusura più la frase finale della variante (7, 3 o 7 parole),
non `TESTO_CHIUSURA`, che il copione deve comunque avere e che `conFraseFinale` sostituisce dopo la validazione. A
Claude il prompt dà solo le parole prima della chiusura, i limiti meno la frase scelta (`paroleContenuto`).

Le regole di varietà non dipendono dal numero di scene e non vanno scalate. «Mai lo stesso tipo di fila» vale con
qualunque lunghezza. La somiglianza con i video recenti è una quota sulla sequenza più lunga: con 3 scene (corta da 4
frasi) il 70 % vuole tutte e 3 uguali, 2 su 3 passano; contro un video più lungo una corta non arriva mai alla soglia
(3 posizioni su 6 o più). `windows10`, la fixture del video approvato (8 frasi, 64 parole prima della chiusura), è
una media con ogni frase finale, come `VARIANTE_BASE.durata`.

Il job ha `timeout-minutes: 90` (era 75): una lunga sono fino a 9 scene e 40 secondi, e il render (circa 43 minuti per
un video medio sui runner da 2 vCPU) cresce con loro. Il ruolo AWS dura 7200 s dal passo delle credenziali, che viene
dopo installazioni e articolo: copre i 90 minuti.

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
  chiave è almeno 1,6 volte il resto e sottolineata, e c'è già dal primo fotogramma: un fantasma della stessa riga
  (`fantasmaChiave`, stessa impaginazione parola per parola, inchiostro al 20 %) sotto il titolo vero, che la riempie
  quando la voce la dice. I corpi partono grandi e calano finché la stima (`lineeDi`, a capo a parole intere) sta nel
  90 % della fascia; nessuna parola supera la riga da sola (`emDi`: 0,58 em a lettera, 0,74 le maiuscole, 0,92 m e w;
  nella riga della chiave le minuscole a 0,54 em, perché venga davvero enorme). Quel 0,54 non ha margine: Lora grassetto
  arriva a circa 0,51 em a lettera sulle parole tonde, e la garanzia è il controllo d'impaginazione, non la stima. Una
  chiave nuova va provata lì; `ganci-lunghi` tiene i casi peggiori visti («prenotazione», «autenticazione»,
  «manomissione»). L'oggetto non compare mai: lo spec ammette «o mai», e un oggetto piccolo nell'ultimo terzo vorrebbe dire un
  secondo canvas 3D e un titolo che si sposta. Sopra la parola logo e sottotitolo prendono l'inchiostro delle grafiche
  (`Overlay`).
- **dettaglio** (`ganci/dettaglio.ts`): si apre su un primo piano e si allarga fino alla scena del gancio. Il dettaglio
  dipende dal contenuto: la notifica se arriverà un allarme (allora c'è già dal primo fotogramma, il suo suono va sul
  primo fotogramma, e alla fine la camera ci torna come prima), il titolo della pagina, la barra del desktop, la scheda
  della schermata di blocco, o il punto caldo dell'oggetto. Il titolo della pagina viene dal disegno
  (`riquadroTitoloPagina` accanto a `pagina` in `set/disegni.ts`) più un margine: non è mai tagliato. Sul set la camera
  parte in asse sul dettaglio (`primoPiano` in `set/inquadrature.ts`) largo 820 px, così attorno restano cornice, set e
  luce dello stile, e si allarga con `allarga` (distanza in proporzione, lo zoom sembra uniforme). A tutto quadro il
  riquadro parte fra il logo e il sottotitolo (sopra e sotto la superficie dello stile) e sul sito stringe sulla scheda
  del browser col titolo (`SCHEDA_BROWSER`): il titolo grande intero sarebbe largo quanto la scena. 6 frame fermi, 22 di
  allargamento: il titolo entra solo dopo (le parole dette prima arrivano insieme) e la spinta sulla chiave non comincia
  prima, perché a primo piano lo schermo starebbe sotto il titolo; fino ad allora la voce ha il sottotitolo (`Overlay`).
- **diviso** (`ganci/diviso.ts`, `ganci/Blocco.tsx`): la metà alta è un blocco nell'accento dello stile col titolo
  nella sua posizione di sempre; titolo e logo ci stanno nel colore dello stile che sull'accento contrasta di più
  (fondo, velo, superficie, testo, inchiostro: oltre 3:1 in ogni stile e tinta, `ganci.test.ts`). Dopo 10 frame il
  blocco sale fino alla quota sotto il titolo (lo schermo del portatile sale con il suo bordo; a tutto quadro la
  ripresa parte dal punto che conta), poi in 8 frame svanisce mentre il titolo torna del suo colore: entro 28 frame la
  scena è intera e il titolo non ha mai attraversato il bordo del blocco. Il blocco è un ingombro a bordo: il
  controllo d'impaginazione verifica che il titolo ci stia dentro intero.

Il controllo d'impaginazione misura solo i ganci con `--scene=gancio`; `fixtures/ganci-lunghi.storyboard.json` ha tre
domande da 64 caratteri con la chiave da 18 all'inizio, in mezzo e in fondo.

### Le chiusure

La chiusura dura circa la metà di prima: la frase finale parlata è corta, la coda pure, la scena finale è veloce.

**La frase finale** (`variante.fraseFinale`, 0, 1 o 2) indicizza `FRASI_CHIUSURA` in `storyboard/tipi.ts`, ognuna con
la sua chiave: «Tutto su la voce digitale punto it.» (chiave l'indirizzo, a schermo `lavocedigitale.it`), «Link nel
post.», «Il resto è nel link del post.». L'indirizzo non serve dirlo ogni volta: è scritto nella cartolina e nella fascia.
La frase che Claude scrive oggi («Trovi tutto su la voce digitale punto it, il link è nel post.», `TESTO_CHIUSURA`) non è
fra le tre: resta solo il testo che la validazione si aspetta, e il prompt non cambia. La pipeline sostituisce l'ultima
frase dopo la validazione e prima della voce (`conFraseFinale`, puro e provato): ElevenLabs legge la frase scelta, il
sottotitolo dell'ultima scena (con la cartolina) o la fascia (con l'integrata) la scrivono. Con la cartolina il
sottotitolo di ogni frase resta visibile: la ridondanza lo nasconde solo se ripete parola per parola testata e indirizzo
scritti (`fraseFinale.test.ts`).

La coda dopo l'ultima parola è di 0,8 s (`CODA_S` in `linea.ts`, prima 1,2): la musica esce in tutta la coda, lineare,
dopo l'ultima parola (`USCITA` in `mix.ts` ne è derivata; prima 1 s su una coda di 1,2). Stima con la voce di oggi
(`out/durate-chiusure.ts`, fuori da git: il ritmo per sillaba della frase di oggi nelle voci già pagate, per le sillabe
della frase nuova, più attacco e 0,35 s di silenzio finale): «Tutto su …» 3,2–3,5 s parlate, «Link nel post.» 1,1–1,2 s,
«Il resto è nel link del post.» 2,2–2,4 s; con la coda la chiusura dura 4,0–4,3 s, 1,9–2,0 s e 3,0–3,2 s, contro 6,3–6,9 s
di prima. Le sillabe chiuse di «Link nel post» si dicono più lente della media: quella stima è per difetto.

**cartolina** (`scenes/Chiusura.tsx`): la scheda finale sulla superficie delle grafiche dello stile (`Foglio`: carta,
poster, griglia, scheda). Marchio e testata entrano in 6 frame dal primo (`ENTRATA_CHIUSURA`), l'indirizzo è scritto
entro 20 frame anche se la voce lo dice dopo, e la sottolineatura parte quando la voce lo dice (`piani/chiusura.ts`). Prima
la testata partiva al frame 4 in 10 frame e l'indirizzo aspettava la voce (un secondo e mezzo). La cartolina quindi cambia:
la regressione a pixel quasi identici vale per le scene prima della chiusura, non per lei. La testata è a
`100 / larghezza` px: col mono della notte (1,2) sta su una riga, negli altri stili resta 100.

**integrata**: nessuna scena finale. In `Notizia` l'ultima scena di contenuto resta montata anche per la durata della
chiusura dentro `Ferma` (`editoriale/Ferma.tsx`): oltre la sua fine vede sempre il suo ultimo frame (lo stesso trucco della
`Spinta`, una `Sequence` interna spostata di quanto si è oltre la fine; niente `<Freeze>`, che azzera l'origine della
sequenza) e si avvicina piano del 2 % (`scalaFerma` in `editoriale/fermo.ts`). Non esce con la spinta, lo scorrimento o il
lampo dello stile: la chiusura non è un cambio di scena. Sopra, la scena ferma si vela (il `velo` dello stile al 35 %) e
la fascia (`scenes/ChiusuraIntegrata.tsx`) sale dal basso in 6 frame, nel velo dello stile col filo dell'accento in cima:
il logo a 180 px, la frase detta (46 px, diviso per la `larghezza` dello stile) senza l'indirizzo («Tutto su», «Link nel post», «Il resto è nel link del post»,
`attaccoChiusura`) e sotto l'indirizzo a 88 px, sottolineato quando la voce lo dice (tempi della cartolina). La fascia sta nel terzo basso, da
`FONDO_UTILE - 10` (1350) per 290 px: sopra ci sono i titoli bassi delle scene, che finiscono prima di `FONDO_UTILE`, e
una fascia più alta li coprirebbe in quasi ogni scena del set. Prende il posto del sottotitolo, che durante la chiusura
integrata non c'è (`Overlay`): la fascia scrive la frase scelta e l'indirizzo, anche quando la frase non lo dice. I suoi testi si misurano come sottotitolo (nella sua zona,
mai sopra), e la fascia pubblica il suo ingombro pieno (`data-ingombro="fascia"`): il controllo d'impaginazione segnala
ogni testo della scena ferma che le finisse sotto. Niente fruscio della carta: non c'è un foglio. Sotto la fascia
grana e vignettatura seguono la scena ferma, non la chiusura (`Overlay`). Vale uguale in schermo: la fascia è 2D e
`Ferma` non sa che cosa tiene fermo; finché la scena dura `Ferma` non applica nessuna trasformazione, e i fotogrammi prima
della chiusura sono identici a quelli con la cartolina.

Il frame fermo è l'ultimo della scena: lì il piano ha già scritto tutti i testi. I piani tengono testi e segni dentro la durata
(`Math.min(durata - …)`), e `fermo.test.ts` lo prova per ogni scena di ogni fixture
messa come ultima di contenuto, con frasi da 1 a 3 s: la durata corta con il copione al limite inferiore sta sopra
quel minimo. `fixtures/chiusura-corta.storyboard.json` è quel caso (4 frasi, 29 parole prima della chiusura, un allarme sul telefono prima
della chiusura). La spinta lenta, come le transizioni, è spenta nel controllo d'impaginazione: a fine chiusura un testo
sul margine o vicino al sottotitolo si sposta in fuori di circa 10 px.

Il controllo d'impaginazione forza le dimensioni con `--stile= --gancio= --chiusura= --durata=` (un valore
sconosciuto è un errore; uno valido ma non ancora in `ATTIVI` dà un avviso, perché il fotogramma mostra
ancora quello di base) e con `--variante=luce:sera,apertura:alta`:

```
node --experimental-strip-types pipeline/controlla-impaginazione.ts fixtures/matrice-03.storyboard.json --passo=5 --secondi=4 --stile=studio
```

### I dettagli

Quattro dettagli cambiano da un video all'altro senza essere una dimensione della variante né una voce dello storico.
Si ricavano ogni volta dallo slug con `dettagliDi(slug, stile)` (`src/editoriale/dettagli.ts`), quindi un video
rifatto in locale ha gli stessi.

- **L'ora sugli schermi**:
  - dove compare: nella barra del portatile, nella barra di stato del telefono e nell'orologio grande della schermata
    di blocco;
  - la fascia è 07:00-22:59, perché un telefono guardato alle tre di notte stonerebbe;
  - la data resta quella del copione (`storyboard.orologio`): i disegni ricevono `Orologio = { ora, data? }`.
- **La finitura del telefono**, cioè il colore della cornice in alluminio (`FINITURE`):
  - i valori sono grafite (quella di prima), argento, blu e sabbia;
  - si vede solo nel 3D: nello stile schermo il telefono è a tutto quadro, senza scocca.
- **Lo sfondo della schermata di blocco**:
  - ce ne sono quattro per stile, presi dalle prime quattro tinte diverse della sua tavolozza (accento, superficie,
    timbro, segno su chiaro, penna, tenue) e mescolati a un buio `#10131a`;
  - due hanno al centro un alone della stessa tinta, che si spegne prima del bordo alto e di quello basso, così a
    tutto quadro il riquadro attorno al disegno (`fondoTelefono`) combacia;
  - la quantità di tinta scende finché il testo più debole della schermata, il titolo `#f3f4f6` sul riquadro bianco
    al 12 %, sta sopra 5:1, anche al centro dell'alone. `dettagli.test.ts` lo prova per ogni stile e per ogni tinta
    dello studio.
- **Gli oggetti di scena sulla scrivania**: due fra taccuino, tazza e pianta, e solo nel set scrivania (studio e notte
  non ne hanno).

Ogni scelta passa da `improntaMescolata(slug:chiave)`: FNV-1a e poi un rimescolamento finale (il fmix32 di murmur3),
lo stesso della variante e della tinta dello studio. FNV-1a da sola
mescola poco i bit bassi: con `% 4`, due scelte con chiavi che finiscono con la stessa lettera andavano di pari passo
(stessa finitura, quindi stesso sfondo). Il test controlla che su 400 slug escano tutte le 48 combinazioni.

Come la variante e lo stile, i dettagli scendono con un contesto (`DettagliVideo`, `useDettagli()`) letto fuori dal
canvas e poi passati come prop:

- `Set3D` li passa al set, per l'ora del portatile e gli oggetti di scena;
- le scene 3D li passano a `Smartphone` e a `OggettoSulPiano`;
- le scene di schermo li passano a `contenutoTelefono` e a `contenutoPortatile`.

Tazza e pianta (`set/OggettiDiScena.tsx`) sono fatte di primitive (cilindri, tori, coni a cinque facce), senza asset
esterni. Stanno tutte e due a sinistra, lontano dal portatile:

- la tazza davanti, oltre il taccuino;
- la pianta in fondo, verso il muro.

Così si vedono poco: entrano ai margini di alcune inquadrature (il rischio basso sul portatile, l'apertura radente,
i ganci sugli oggetti a destra) e non al centro. Le posizioni più in vista non passano il controllo:

- davanti al portatile, nell'inquadratura bassa del rischio, una tazza riempiva mezzo fotogramma sotto il sottotitolo;
- dietro, accanto allo schermo, nell'apertura la tazza si vedeva bene, ma nei ganci sugli oggetti a destra (chiavetta,
  telefono, router, carta) la camera la portava in alto, sotto i titoli;
- la pianta in fondo a sinistra, ma più vicina al portatile, finiva dietro il titolo del gancio sulla chiavetta
  nell'apertura radente.

Verso il muro, cioè più in alto nel fotogramma, ci sono i titoli, larghi quasi quanto il fotogramma. Per questo tazza
e pianta dichiarano un ingombro pieno (`IngombriDiScena`) e il controllo
d'impaginazione segnala ogni testo che ci passa sopra. L'ingombro è la sagoma vera (`set/sagome.ts`), non una scatola:

- la tazza è un cilindro largo quanto corpo e manico;
- la pianta è il vaso più la punta di ogni foglia (`FOGLIE`, le stesse del modello);
- l'involucro proiettato viene tagliato al fotogramma;
- l'ingombro sparisce quando la parte in quadro cade tutta dentro lo schermo del portatile e la sagoma sta oltre il
  suo piano. Nei primi piani sullo schermo la tazza è lì dietro, nascosta: con una scatola il controllo segnalava
  titoli sopra un oggetto che non si vede.

Il taccuino non dichiara un ingombro: c'era già e non è mai stato controllato.

**Regressione.** `PropsNotizia.dettagli` è un `Partial<Dettagli>` che si appoggia sopra quelli dello slug.

- `DETTAGLI_BASE` (10:24, grafite, `#1b2230` senza alone, solo il taccuino) è il video approvato. Con quello la
  scrivania resta identica a prima. Nel repo non c'è un banco di regressione: gli script dei provini stanno in `out/`,
  che è fuori da git. Chi confronta i fotogrammi deve passare `dettagli: DETTAGLI_BASE` nelle props del render, come per
  `variante`: senza, i dettagli vengono dallo slug e l'ora, lo sfondo e gli oggetti cambiano.
- Il controllo d'impaginazione prende i dettagli dallo slug:
  - `--dettagli=base` forza quelli di base;
  - `--oggetti=taccuino,tazza,pianta` forza gli oggetti. Con tutti e tre, un giro solo controlla ogni coppia
    possibile, perché ogni oggetto ha il suo posto fisso.

### Il controllo di somiglianza

La variante evita i valori degli ultimi video dimensione per dimensione. Non sa però come il video *appare* rispetto a
quelli già usciti. Il controllo lo misura sui fotogrammi, dopo il controllo d'impaginazione e prima del render
completo.

**L'impronta.** Sei fotogrammi fissi: inizio, 1 s, 30 %, 50 %, 70 % e 90 % della durata. Li fa `renderFotogrammi`
(`pipeline/controlla-impaginazione.ts`), con lo stesso bundle del controllo d'impaginazione: il bundle si fa una volta
per processo. Per ogni fotogramma ffmpeg dà due valori:

- un dHash a 64 bit (`scale=9:8,format=gray`, `rawvideo`): un bit per coppia di pixel vicini, 1 se il sinistro è più
  chiaro;
- il colore medio (`scale=1:1`).

Tutte e due le scale usano `flags=area`. Col bicubico di default l'1×1 campiona solo il centro, non fa la media.
Nello storico ogni fotogramma è una stringa da 23 caratteri, `dHash in esadecimale#rrggbb`.

**La distanza** (`distanza`) va da 0 a 1. Per ogni fotogramma si sommano la forma (Hamming / 64), pesata `PESO_FORMA` =
0.65, e il colore (distanza RGB normalizzata), pesato 0.35. Poi si fa la media sui sei fotogrammi, col primo che pesa il
doppio. Il video si confronta con gli ultimi 3 dello storico che hanno un'impronta (`confronta`, `CONFRONTATI`). Le voci senza impronta,
cioè quelle vecchie o quelle di un controllo saltato, si ignorano.

**Sotto `SOGLIA` (0.32)** si cambia variante con `prossimaVariante`:

- cambiano solo stile e gancio, perché voce e copione sono già pagati: frase finale e durata restano, e restano anche
  musica, luce, apertura e chiusura;
- al secondo tentativo cambia lo stile, verso uno mai usato negli ultimi 3 se c'è, altrimenti con la memoria più
  lunga possibile, e mai uno già provato: se non ce n'è uno libero la memoria si accorcia;
- il gancio cambia al terzo tentativo, o già al secondo se il nuovo stile con lo stesso gancio è fra gli ultimi 3. In
  quel caso va verso un gancio mai usato con quello stile;
- la memoria dei tentativi è `CONFRONTATI` (3), più severa della `PROFONDITA` della variante, che per stile e gancio è
  2: un tentativo evita anche il terzo video, perché è lì che il confronto ha trovato la somiglianza;
- le scelte sono deterministiche da slug e numero del tentativo;
- ogni variante nuova ripassa il controllo d'impaginazione, e se non lo passa è scartata ma conta;
- al massimo 3 tentativi, poi si tiene la variante più lontana;
- un tentativo nuovo parte solo se resta tempo per il render nei 90 minuti del job: entro 45, 30 o 19 minuti
  dall'inizio della pipeline per una corta, una media o una lunga (`ULTIMO_TENTATIVO_MINUTI`, da stringere con i tempi
  dei primi resoconti). Oltre, si tiene la più lontana e il resoconto dice «tempo finito».

Il controllo non blocca mai la pubblicazione: un errore di ffmpeg o del render dei fotogrammi lo salta, e il video
esce senza impronta. Il resoconto Telegram dice come è andata, per esempio «Somiglianza: ok, distanza minima 0.41 da
…» oppure «cambiata variante 1 volta (…), ok con notte/scena…», e riporta il tempo speso.

**Taratura** (9-10 novembre 2026), con `pipeline/taratura-somiglianza.ts`:

- i video pubblicati (4 mp4, tutti scrivania/scena) e 4 render locali di uno stesso copione nei quattro stili;
- i fotogrammi fissi di tre copioni reali in tutti gli stili e i ganci, 23 combinazioni, fatte con le voci già pagate.

Contano le coppie fra copioni diversi, perché in produzione due articoli non sono mai lo stesso:

| coppie, `PESO_FORMA` 0.65 | n | distanza |
|---|---|---|
| stesso stile e stesso gancio | 39 | 0.149–0.307 |
| stile diverso | 234 | 0.341–0.654 |
| stesso stile, gancio diverso | 56 | 0.208–0.417 |
| stesso copione e variante, mp4 pubblicato contro render locale | 1 | 0.01 |

La soglia 0.32 sta fra 0.307 e 0.341, con un margine di 0.013 sopra le coppie dello stesso stile e gancio e di 0.021
sotto quelle di stile diverso. Il margine è piccolo e dipende dal peso della forma:

- solo con un peso fra 0.6 e 0.7 le due classi si separano;
- col solo colore e con la sola forma si sovrappongono;
- i fotogrammi centrali seguono le scene del copione più che lo stile: fra due scrivania il colore al 50 % arriva a
  0.7.

Le coppie dello stesso stile con un gancio diverso cadono a cavallo della soglia: 36 su 56 stanno sotto.

**Perché 3 video e non 5.** Gli stili sono 4 e la variante esclude solo gli ultimi 2. Con una finestra di 5, lo stile
di uno degli ultimi 5 tornava nel 92 % dei casi. Siccome quasi tutte le coppie dello stesso stile cadono sotto la
soglia, l'86 % dei video avrebbe esaurito i 3 tentativi.

Con la finestra di 3 la simulazione su 500 slug in fila, con la variante vera e i tentativi rimessi nello storico, dà:

- se basta lo stesso stile per essere troppo simili (il caso pessimista), ritenta il 40.8 % dei video e nessuno arriva
  al terzo tentativo;
- se serve la stessa coppia stile+gancio, ritenta il 31.0 % e anche qui nessuno arriva al terzo.

Il secondo tentativo trova sempre una variante libera. La realtà sta fra i due casi. Questi numeri vengono da prima
del rimescolamento dell'impronta (vedi «Varianti e stili»): oggi passano tutte le 16 coppie stile/gancio, e le
percentuali vanno rifatte con la taratura.

Un tentativo costa un controllo d'impaginazione più 6 fotogrammi. Sul Mac di sviluppo sono circa 11 s più 4 s, e la prima impronta col bundle 7 s; sul
runner, che ha 2 vCPU e gira in `swangle`, ci vuole di più.

Per ritarare, dalla radice del repo:

```
RENDER_GL=angle node --experimental-strip-types pipeline/taratura-somiglianza.ts \
  out/<slug>/<slug>.mp4=pubblicato out/<slug>/props.json@notte/parola=notte-parola
```

Stampa per ogni voce l'impronta e i secondi, poi la matrice delle distanze. `@stile/gancio` forza la variante come
farebbe un tentativo della pipeline.

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
