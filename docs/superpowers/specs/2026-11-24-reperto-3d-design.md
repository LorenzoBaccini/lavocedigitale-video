# Scena «reperto»: oggetti 3D grandi che reagiscono — design

Data: 2026-11-24. Stato: approvato dall'utente («fai il 3D adesso»), dopo la bozza della Cronaca Digitale.

## Perché

Nel campione cronaca le scene centrali sono ancora schede di testo: il video resta piatto proprio dove dovrebbe
spiegare il meccanismo del reato. La bozza approvata prometteva «uno grande al centro per scena: telefono, carta di
pagamento, lucchetto… reagiscono alla voce (si crepano, si accendono, cadono)».

## Il design

- **Nuovo tipo di scena `reperto`**: `{ etichetta, titolo, reperto, messaggio? }`.
  `reperto` è uno tra `telefono`, `carta`, `lucchetto`. Ogni reperto ha **una** reazione fissa, così il copione
  sceglie solo l'oggetto:
  - `telefono`: in piedi, schermo acceso con un SMS (`messaggio`, facoltativo, solo con `telefono`); sulla chiave il
    vetro si crepa a raggiera e il fumetto diventa rosso sirena.
  - `carta`: la carta di pagamento ruota; sulla chiave si spezza in due e le metà si allontanano.
  - `lucchetto`: chiuso; sulla chiave l'arco scatta e si apre, il corpo si accende di rosso.
- **Regia**: l'oggetto sta al centro, grande, fra il titolo in alto e i sottotitoli; gira piano su sé stesso e
  ondeggia. Sulla chiave un sobbalzo dell'oggetto (non della camera: niente zoom a scatto), una luce rossa che pulsa
  e un suono nuovo `crepa` (vetro/metallo che cede, sintetizzato). La camera si avvicina lenta e continua.
- **Set**: lo stesso buio del set notturno (luci dello stile), senza portatile né scrivania: solo il piano scuro e il
  reperto.
- **Testo**: occhiello + titolo in alto, come le altre scene 3D. Il `messaggio` sul telefono è il testo del
  truffatore, diverso dalla frase detta: non duplica i sottotitoli. Nessun simbolo sopra l'oggetto.
- **Validazione**: etichetta (32), titolo (24), messaggio (64, come la notifica) solo con `telefono`. Al massimo due
  reperti per video: restano un colpo, non la regola. Non contano come scene «su un dispositivo».
- **Impaginazione**: il reperto registra il suo ingombro; la camera lo tiene fra il titolo e la fascia dei
  sottotitoli (`fraLeQuote`). La matrice lo controlla con una fixture dedicata.
- **Prompt**: riga nella tabella delle scene, regola d'uso (cronaca: il reperto mostra il meccanismo; il messaggio
  solo se l'articolo riporta il testo vero) e un esempio che lo usa.

## Non obiettivi

- Modelli esterni (glTF), texture scaricate: tutto in geometria e canvas, 0 €.
- Altri reperti (busta, documento, banconota): si aggiungono dopo, se i primi funzionano.

## Lasciato a chi costruisce

Proporzioni e materiali degli oggetti, curve del sobbalzo e della crepa, il suono esatto.
