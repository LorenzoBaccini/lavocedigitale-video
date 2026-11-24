# Fixture del video

- `windows10.storyboard.json`: lo storyboard di prova.
- `windows10.timing.json`: il `timing.json` prodotto dalla voce per quello storyboard, con i tempi per parola.
- `windows10.props.json`: le props della composizione `notizia` (`{ storyboard, timing, audioBase: "audio/fixture" }`) per le righe di comando (render, controllo). Lo studio (`Root.tsx`) le costruisce da storyboard e timing; `src/fixture.test.ts` controlla che il file sia la loro unione.
- `tutte-le-scene-3.storyboard.json`: le ambientazioni al limite dei campi: gancio con la pagina web,
  allarme e rischio sul telefono, le scene `telefono` e `documenti`, oggetto con `menu` sul sito e nell'app, `orologio`.
- `windows10.storyboard.json` dichiara `orologio`, `mittente`, `azione` e `menu`: riproduce le schermate del video di riferimento
  (data della barra, «Avviso di sicurezza» con lo scudo, «Apri le impostazioni», colonna Sistema…Aggiornamenti) senza che il codice le abbia scritte dentro.
- `tutte-le-scene.storyboard.json` e `tutte-le-scene-2.storyboard.json`: insieme coprono tutti i tipi di scena con un
  dispositivo o su carta di prima (le scene senza schermi `simbolo`, `passi`, `flusso` e `mappa` stanno in
  `scene-nuove` e `scene-nuove-2`) e,
  con `windows10` (portatile e chiavetta), tutti gli oggetti, anche `"nessuno"`; ogni testo è lungo quanto il massimo di `LIMITI`. Servono a verificare a
  vista che i testi al limite entrino nello schermo. Non hanno voce: per gli still si costruiscono props con un timing
  finto (per esempio 3 s a clip e inviluppo piatto) che riusa i wav di `audio/fixture`.
  `pipeline/controlla-impaginazione.ts` accetta direttamente lo storyboard e fa lo stesso: devono uscire puliti.
- `matrice-NN.storyboard.json` (generate da `python3 fixtures/matrice.py`, non a mano): ogni tipo di scena per ogni
  dispositivo e schermata ammessi, con i testi corti e con quelli al limite dei `LIMITI` (titoli su due righe,
  etichette, sopratitoli, notifiche, menu, opzioni e note al massimo). Le ganci stanno in `matrice-01` e `-02`, le
  sole da provare con `--ogni-apertura` (l'apertura cambia solo il gancio). Le scene senza schermi stanno in
  `matrice-11`, `-12` e `-13`: `simbolo` con e senza `barrato`, `passi` da 2 e da 4, `flusso` da 2 e da 3 (pittogrammi
  assenti, su tutte le righe o solo su alcune), `mappa` in tutte e tre le forme; le matrici fino a `-10` non cambiano.
  Hanno scene dello stesso tipo di fila: sono
  valide come storyboard ma la pipeline le scarterebbe. Il controllo esaustivo:
  `controlla-impaginazione.ts fixtures/matrice-NN.storyboard.json out/matrice --passo=5 --secondi=4` (un fotogramma
  ogni 5, frasi da 4 s), deve uscire pulito per tutte.
- `rischio-portatile.storyboard.json`: tre `rischio` sul portatile (con e senza `dispositivo`) con sopratitolo e
  titolo cortissimi, medi e al limite, più un allarme sul portatile. Riproduce un caso reale di video scartato (schermo a
  cavallo del sopratitolo). Va provata con `--passo=15`: deve uscire pulita in ogni fotogramma.
- `ganci-lunghi.storyboard.json`: tre ganci con la domanda più lunga che si scrive per intero (64 caratteri) e una
  chiave da 18 all'inizio, in mezzo e in fondo, su portatile con pagina, telefono e chiavetta; più due chiavi di una
  parola sola lunga e tonda («autenticazione» su un'app, «manomissione» col router), il caso peggiore della stima della
  larghezza della chiave. Serve al gancio
  `parola` (niente testo fuori dai margini) e agli altri formati: `--gancio=parola --scene=gancio --passo=5`.
- `chiusura-corta.storyboard.json`: un copione corto con un allarme sul telefono subito prima della chiusura: il caso
  della chiusura integrata che ferma una scena 3D corta. Si prova con frasi cortissime:
  `--secondi=1.2 --chiusura=integrata --scene=chiusura --passo=5`.
- Le fixture d'impaginazione (`tutte-le-scene*`, `scene-nuove*`, `matrice-NN`, `rischio-portatile`, `ganci-lunghi`,
  `chiusura-corta`) finiscono con una domanda: corta («Tu lo sapevi?») o la più lunga ammessa, 12 parole. Hanno testi al
  limite apposta e non rispettano le regole del copione (gancio, durata): i test le validano solo nei campi e nelle scene.
  `windows10` resta il video approvato di prima, con la sua voce (`windows10.timing.json`).
- `veloce.storyboard.json`: il copione del format veloce (gancio di 7 parole, toni, domanda finale), una lunga da 8 frasi
  e 69 parole; è la base dei test di validazione e del post. `durata-media` sono le sue frasi senza la terza e la quarta.
- `durata-corta.storyboard.json` e `durata-lunga.storyboard.json`: le due durate nel format veloce, 4 frasi e 30 parole,
  8 frasi e 72 (il massimo della lunga). Passano `validaStoryboard` solo nella loro durata ed `erroriVarieta` senza video
  recenti (`src/storyboard/durata.test.ts`).
- `matrice.py` non rigenera più le matrici del repo: emette ancora `oggetto: "nessuno"` nelle scene `oggetto`, che la
  validazione scarta dal 13 novembre (le fixture sono state corrette a mano).
- `scene-nuove.storyboard.json`: le scene senza dispositivi. Tre `simbolo` (uno con `barrato`, uno con il
  titolo al limite di 24 caratteri e l'occhiello al limite di 32, uno corto) e due `passi` (uno da quattro passi con
  testi al limite di 28 caratteri, tre con pittogramma e uno senza per provare l'allineamento, uno da due senza) e due
  `flusso` (uno da tre nodi con testi al limite di 18 caratteri e tutti i pittogrammi, uno da due nodi con il
  pittogramma solo sul primo), alternati, più la chiusura. Oggi è una media con ogni frase finale
  (`src/storyboard/valida.test.ts`); con 8 frasi è al tetto di `media` e ha 60 parole prima della chiusura (65 al
  massimo con le frasi finali da 7 parole): è piena, le scene nuove vanno in `scene-nuove-2`. Il controllo, in ogni
  stile: `controlla-impaginazione.ts fixtures/scene-nuove.storyboard.json --stile=notte --scene=flusso --passo=5`
  (o `--scene=passi`, `--scene=simbolo`).
- `scene-nuove-2.storyboard.json`: il seguito di `scene-nuove`, con le tre `mappa`, una per forma (`punto`, `area`,
  `percorso`), tutte col titolo al limite di 24 caratteri e i luoghi al limite di 20; i luoghi e i titoli sono
  generici, senza posti veri. In mezzo un `simbolo`, un `passi` e un `flusso`, più la chiusura. È una media con ogni
  frase finale (7 frasi, 62 parole prima della chiusura: `src/storyboard/valida.test.ts`). Il controllo, in ogni
  stile: `controlla-impaginazione.ts fixtures/scene-nuove-2.storyboard.json --stile=notte --scene=mappa --passo=5`.
- Nessuna fixture dichiara `variante`: hanno tutte l'aspetto di base. Le varianti si provano con
  `controlla-impaginazione.ts <fixture> --ogni-apertura` (le tre inquadrature d'apertura del gancio) o
  `--variante=musica:chiaro,luce:sera,apertura:alta`; stile, gancio, chiusura e durata con
  `--stile= --gancio= --chiusura= --durata=`.
- Le fixture `tutte-le-scene-2` e `-3` mettono due `oggetto` di fila: sono valide come storyboard, ma la pipeline
  (`erroriVarieta`) le scarterebbe. Servono a provare le scene, non sono esempi di copione.

I wav della fixture restano solo in locale: `public/audio` è in `.gitignore`. La voce è
ElevenLabs (`eleven_v3`). Rigenerarla costa ~450 crediti a ogni lancio: una
volta sola, con la chiave in `ELEVENLABS_API_KEY`:

```
node --experimental-strip-types pipeline/voce-elevenlabs.ts fixtures/windows10.storyboard.json public/audio/fixture
```

Scrive `voce.mp3` e `allineamento.json` (la risposta di ElevenLabs), `s{i}.wav` e `timing.json`.
Per rifare clip e timing senza spendere crediti (per esempio dopo un cambio al taglio), aggiungi
`--riusa`: riparte da `voce.mp3` e `allineamento.json` già nella cartella.

Poi copia `public/audio/fixture/timing.json` su `fixtures/windows10.timing.json` e ricostruisci
`windows10.props.json` unendo storyboard, timing e `audioBase`. Se il timing cambia, i frame delle
scene cambiano con lui.
