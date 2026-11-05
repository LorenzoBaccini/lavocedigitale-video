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
- `rischio-portatile.storyboard.json`: tre `rischio` sul portatile (con e senza `dispositivo`) con sopratitolo e
  titolo cortissimi, medi e al limite, più un allarme sul portatile. Riproduce un caso reale di video scartato (schermo a
  cavallo del sopratitolo). Va provata con `--passo=15`: deve uscire pulita in ogni fotogramma.
- Nessuna fixture dichiara `variante`: hanno tutte l'aspetto di base. Le varianti si provano con
  `controlla-impaginazione.ts <fixture> --ogni-apertura` (le tre inquadrature d'apertura del gancio) o
  `--variante=musica:chiaro,luce:sera,apertura:alta`.
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
