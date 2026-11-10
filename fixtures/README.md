# Fixture del video

- `windows10.storyboard.json`: lo storyboard di prova.
- `windows10.timing.json`: il `timing.json` prodotto dalla voce per quello storyboard, con i tempi per parola.
- `windows10.props.json`: le props della composizione `notizia` (`{ storyboard, timing, audioBase: "audio/fixture" }`) per le righe di comando (render, controllo). Lo studio (`Root.tsx`) le costruisce da storyboard e timing; `src/fixture.test.ts` controlla che il file sia la loro unione.
- `tutte-le-scene-3.storyboard.json`: le ambientazioni al limite dei campi: gancio con la pagina web,
  allarme e rischio sul telefono, le scene `telefono` e `documenti`, oggetto con `menu` sul sito e nell'app, `orologio`.
- `windows10.storyboard.json` dichiara `orologio`, `mittente`, `azione` e `menu`: riproduce le schermate del video di riferimento
  (data della barra, «Avviso di sicurezza» con lo scudo, «Apri le impostazioni», colonna Sistema…Aggiornamenti) senza che il codice le abbia scritte dentro.
- `tutte-le-scene.storyboard.json` e `tutte-le-scene-2.storyboard.json`: insieme coprono tutti i tipi di scena e,
  con `windows10` (portatile e chiavetta), tutti gli oggetti, anche `"nessuno"`; ogni testo è lungo quanto il massimo di `LIMITI`. Servono a verificare a
  vista che i testi al limite entrino nello schermo. Non hanno voce: per gli still si costruiscono props con un timing
  finto (per esempio 3 s a clip e inviluppo piatto) che riusa i wav di `audio/fixture`.
  `pipeline/controlla-impaginazione.ts` accetta direttamente lo storyboard e fa lo stesso: devono uscire puliti.
- `matrice-NN.storyboard.json` (generate da `python3 fixtures/matrice.py`, non a mano): ogni tipo di scena per ogni
  dispositivo e schermata ammessi, con i testi corti e con quelli al limite dei `LIMITI` (titoli su due righe,
  etichette, sopratitoli, notifiche, menu, opzioni e note al massimo). Le ganci stanno in `matrice-01` e `-02`, le
  sole da provare con `--ogni-apertura` (l'apertura cambia solo il gancio). Hanno scene dello stesso tipo di fila: sono
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
- `chiusura-corta.storyboard.json`: un copione da durata corta al limite inferiore (4 frasi, 29 parole prima della
  chiusura) con un allarme sul telefono subito prima della chiusura: il caso della chiusura integrata che ferma una
  scena 3D corta. Passa la validazione con `durata: corta` e ogni frase finale (con `media` no: 4 frasi). Si prova con
  frasi cortissime:
  `--secondi=1.2 --chiusura=integrata --scene=chiusura --passo=5`. Come le altre fixture finisce con `TESTO_CHIUSURA`:
  la frase finale della variante la mette la pipeline (`conFraseFinale`).
- `durata-corta.storyboard.json` e `durata-lunga.storyboard.json`: i due estremi di `LIMITI_DURATA` in parole dette.
  La corta ha 4 frasi e 29 parole prima della chiusura (32 con «Link nel post.»: gancio, rischio e oggetto sul
  telefono), la lunga 9 frasi e 81 (88 con le frasi finali da 7 parole, otto tipi di scena diversi). Sono copioni che
  la pipeline accetterebbe (varietà compresa) con ogni frase finale e passano solo nella loro durata
  (`src/storyboard/durata.test.ts`). Il controllo, in ogni stile e con le due chiusure:
  `controlla-impaginazione.ts fixtures/durata-corta.storyboard.json --stile=notte --chiusura=integrata --passo=5`.
- Le durate delle altre fixture, per chi le valida: `windows10`, le `tutte-le-scene`, `matrice-NN`,
  `rischio-portatile` e `ganci-lunghi` sono medie con ogni frase finale, `chiusura-corta` è corta. `matrice.py`
  aggiunge un teaser ai gruppi con meno di 47 parole prima della chiusura (`matrice-10`), perché restino medie anche
  con «Link nel post.».
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
