# Video tutti diversi — design

## Perché

I primi tre video pubblicati (SPID 6/11, Google Maps 7/11 e 8/11) sembrano lo stesso video con testi diversi.
La varietà attuale agisce dove non si vede: ordine delle scene, luce della scrivania, angolo d'apertura.
Restano identici ambientazione (tavolo di legno, stesso portatile e telefono, blocco schermo alle 10:24, foglio a
quadretti), colori, caratteri, impaginazione, apertura (sempre il portatile sul tavolo), chiusura (4-5 s su 31-34),
durata e ritmo. Chi scorre e i controlli di originalità dei social vedono l'aspetto, non la sequenza.

Obiettivo dell'utente: **ogni video molto diverso dagli altri**, riconoscibile come testata solo da logo e voce.

## Vincoli

- 0 € oltre ElevenLabs; una sola chiamata ElevenLabs per video, mai in loop. Nessuna dipendenza npm nuova.
- Il video deve finire entro il `timeout-minutes` del job (oggi 75, si porta a 90: i minuti del repo pubblico
  sono gratuiti). Ruolo AWS valido 7200 s dal passo delle credenziali.
- Repo pubblico: niente di personale nei file, nei test, nelle fixture.
- Il controllo d'impaginazione resta il cancello: ogni nuovo stile, gancio e chiusura lo deve passare sulla matrice.
- Con `stile: scrivania` e le altre dimensioni ai valori di oggi il video resta quello approvato (regressione a
  pixel quasi identici: PSNR ≥ 40 dB sui fotogrammi di confronto).
- Lo sviluppo vive sul branch `feat/stili`: `main` pubblica ogni giorno e non deve cambiare finché l'utente non
  approva il merge.

## Le dimensioni della variante

La pipeline sceglie tutto, deterministico dallo slug ed escludendo le scelte recenti (come `scegliVariante` oggi).
Claude non sceglie lo stile: scrive il copione nella durata che gli si chiede.

| dimensione | valori | esclusione |
|---|---|---|
| `stile` | `scrivania`, `studio`, `notte`, `schermo` | gli ultimi 2 video (non la rotazione fissa: l'ordine non deve diventare un ciclo) |
| `gancio` | `scena`, `parola`, `dettaglio`, `diviso` | gli ultimi 2 |
| `chiusura` | `cartolina`, `integrata` | l'ultimo |
| `frase finale` | 3 frasi parlate brevi (sotto) | l'ultima |
| `durata` | `corta`, `media`, `lunga` | l'ultimo |
| `musica`, `luce`, `apertura` | come oggi | come oggi |

Nello storico una voce senza `stile` vale `scrivania` (i video pubblicati finora lo sono); per le altre dimensioni
nuove un valore assente non esclude niente.

## Gli stili

Ogni stile è un insieme completo: colori, caratteri, sfondo delle scene grafiche, set delle scene 3D, trattamento del
sottotitolo, allineamento dei titoli, transizioni, grana. Le zone verticali dell'impaginazione (`TITOLO_TOP`, fascia
del sottotitolo, logo) restano le stesse per tutti: il controllo d'impaginazione non cambia regole.

1. **scrivania** — quello di oggi: rovere, foglio di carta, Lora + Inter, ambra.
2. **studio** — fondale continuo a tinta unita (limbo curvo), colore per video da una tavolozza sobria (cobalto,
   salvia, terracotta, senape, lavanda); luce morbida e piena, ombre corte; gli stessi dispositivi senza taccuino.
   Scene grafiche: poster a colore pieno, sans grosso (Space Grotesk), nessuna texture di carta. Sottotitolo in una
   pillola scura arrotondata (risolve il contrasto sugli schermi chiari). Titoli allineati a sinistra.
   Transizione: spinta laterale.
3. **notte** — ambiente quasi nero, piano scuro satinato, due luci di taglio colorate (ciano e magenta) e lo schermo
   che illumina; scene grafiche nere con griglia sottile e caratteri mono luminosi (JetBrains Mono); accento ciano.
   Sottotitolo Inter con la chiave accesa. Titoli centrati. Transizione: lampo breve.
4. **schermo** — niente 3D: la scena mostra lo schermo a tutto quadro, come una registrazione stilizzata (pagina,
   app, impostazioni, notifica, scelte del telefono), con camera che scorre e zooma, puntatore che va su `indica`
   e tocco con onda. Documenti come schede illustrate piatte. Scene grafiche come schede d'interfaccia su grigio
   chiaro, Inter, accento blu di sistema. Sottotitolo scuro su pillola bianca. Render molto più veloce.

I font nuovi sono OFL, scaricati come woff2 latin in `public/fonts` con il loro `OFL-*.txt`, come Inter e Lora.

Stili scartati per ora (troppi asset per il primo giro): diorama isometrico, collage di carta.

## I ganci

Il primo secondo decide se si scorre via, quindi il primo fotogramma di due video di fila deve essere diverso.

- **scena** — quello di oggi, nello stile del video.
- **parola** — tipografia a tutto schermo: la domanda grande, la chiave enorme, parole che entrano a tempo; l'oggetto
  compare solo nell'ultimo terzo, piccolo, o mai.
- **dettaglio** — si apre su un primo piano stretto di un dettaglio (la notifica, il titolo della pagina, il tasto)
  e si allarga fino a mostrare l'oggetto.
- **diviso** — metà alta un blocco di colore con il titolo, metà bassa la scena; il blocco poi si ritira.

## Le chiusure

Più corte: la frase finale passa da 4-5 s a circa 2-3 s.

- Frasi parlate (la pipeline sostituisce l'ultima frase del copione prima della voce):
  «Il resto è su la voce digitale punto it.», «Link nel post: la voce digitale punto it.»,
  «Trovi tutto su la voce digitale punto it.»
- **cartolina** — scheda finale nello stile del video, logo e indirizzo, più veloce di oggi.
- **integrata** — nessuna scena finale: l'ultima scena di contenuto resta ferma con una lenta spinta e una fascia
  con logo e indirizzo entra sopra.

## La durata

Il prompt dice a Claude quale durata scrivere; la validazione applica i limiti di quella durata.

| durata | frasi (chiusura inclusa) | parole | secondi circa |
|---|---|---|---|
| corta | 4-5 | 32-46 | 15-21 |
| media | 6-8 | 50-72 | 23-32 |
| lunga | 8-9 | 72-88 | 32-40 |

## I dettagli che cambiano

Deterministici dallo slug, nessuna voce di storico: l'ora sugli schermi (non più sempre 10:24), il colore del
telefono (4 finiture), lo sfondo della schermata di blocco (dalla tavolozza dello stile), gli oggetti di scena sulla
scrivania (taccuino, tazza, pianta: due su tre).

## Il controllo di somiglianza

Dopo il controllo d'impaginazione e prima del render completo:

1. Si renderizzano 6 fotogrammi fissi (inizio, 1 s, 30 %, 50 %, 70 %, 90 %).
2. Per ognuno un'impronta: dHash 64 bit (ffmpeg → 9×8 grigio, `rawvideo`) e colore medio (ffmpeg → 1×1).
3. Distanza da ognuno degli ultimi 5 video dello storico (impronte salvate nella loro voce): Hamming normalizzata
   per posizione, il primo fotogramma pesa doppio, più la differenza di colore.
4. Sotto soglia si cambia variante (stile e gancio successivi fra i liberi), stessa voce, e si ricontrolla: al
   massimo 3 tentativi, poi si tiene la più lontana e il resoconto lo dice.
5. Le impronte del video pubblicato entrano nello storico. La soglia si tara sui video reali: due video dello
   stesso stile e gancio devono risultare vicini, due di stile diverso lontani.

ffmpeg è già nel job (statico, con checksum): nessuna dipendenza nuova.

## Il resoconto

Telegram riporta anche stile, gancio, chiusura, durata e l'esito del controllo di somiglianza.

## Lasciato a chi costruisce

Palette esatte, curve d'animazione, forme delle transizioni, scelta di come ogni scena 3D si traduce in `schermo`:
contano i vincoli sopra e il giudizio sui fotogrammi (provini messi a confronto con quelli dei video pubblicati).
