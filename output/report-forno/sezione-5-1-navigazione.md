# 5.1 Modello di navigazione progettuale

Il modello di navigazione descrive le pagine previste per la versione finale della web app del Forno DiGesù e i percorsi attraverso i quali gli utenti possono raggiungerle. Seguendo l'impostazione adottata nel report Promusic, ciascun nodo rappresenta una pagina e riporta le principali funzionalità disponibili; le frecce descrivono i collegamenti e le transizioni, indicando l'azione o la condizione che consente il passaggio.

Il diagramma distingue tre ambiti: pagine pubbliche, area cliente e area gestore. La barra di navigazione comune permette di raggiungere Home e Catalogo da tutte le pagine e propone gli altri collegamenti in funzione della sessione e del ruolo. Il visitatore dispone dei collegamenti a Registrazione e Login; il cliente autenticato può raggiungere Area personale e Carrello; il gestore può raggiungere l'Area gestore. Il comando Esci termina la sessione e riporta al Login.

Il percorso pubblico principale conduce dalla Home al Catalogo e, selezionando un prodotto, al relativo dettaglio, dove sono consultabili informazioni e recensioni. L'aggiunta al carrello richiede il ruolo cliente; la pubblicazione di una recensione richiede inoltre la verifica dell'acquisto del prodotto. Questi requisiti sono condizioni dell'azione e devono essere verificati dal sistema.

La registrazione completata correttamente conduce alla pagina Login. In caso di autenticazione riuscita, il sistema indirizza il cliente all'Area personale e il gestore all'Area gestore. Dati di registrazione non validi o credenziali errate non consentono il passaggio alla pagina successiva e producono una segnalazione nel modulo. L'accesso a una pagina riservata senza una sessione valida comporta il reindirizzamento al Login; una sessione valida con ruolo non autorizzato comporta il rifiuto dell'accesso.

Dall'Area personale il cliente raggiunge Carrello, I miei ordini e I miei ticket. Il Carrello permette di modificare quantità, rimuovere articoli e confermare l'acquisto dopo il riepilogo. A seguito della creazione dell'ordine, il percorso progettuale conduce al suo dettaglio. La stessa pagina è raggiungibile selezionando un ordine nello storico personale. La pagina dei ticket consente l'apertura delle richieste e la consultazione dei dettagli e delle risposte in una finestra dedicata.

Dall'Area gestore sono raggiungibili Gestione catalogo, Gestione ordini, Gestione ticket e Clienti. La gestione del catalogo conduce al modulo di aggiunta o modifica del prodotto; il salvataggio riuscito riporta all'elenco. Selezionando un ordine si accede al relativo dettaglio, dove il gestore può aggiornarne lo stato. La gestione dei ticket comprende la consultazione e la risposta alle richieste, mentre la pagina Clienti permette di consultarne i dati consentiti.

Le linee continue rappresentano collegamenti o azioni; le linee tratteggiate rappresentano reindirizzamenti; le condizioni tra parentesi quadre precisano i requisiti di accesso. I collegamenti globali sono raccolti nella barra comune per evitare di ripetere le frecce da ogni pagina. Il diagramma illustra i principali percorsi previsti e non costituisce una rappresentazione esaustiva di ogni evento dell'interfaccia.

Il modello è progettuale: nella versione 0.1 sono presenti Home, Registrazione, Login e Area privata. Il reindirizzamento differenziato per ruolo e i percorsi e-commerce e amministrativi sono previsti per le successive iterazioni. Il modello non prevede un elenco pubblico degli utenti registrati.

*Figura — Modello di navigazione progettuale del Forno DiGesù: pagine, funzionalità, collegamenti e condizioni di accesso per visitatore, cliente e gestore.*
