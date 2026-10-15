export type RegistrazioneState = {
  errors?: {
    username?: string;
    password?: string;
  };
  message?: string;
};

export type LoginState = {
  errors?: {
    username?: string;
    password?: string;
  };
  message?: string;
};

export type ProdottoFormState = {
  errors?: Partial<Record<"nome" | "descrizione" | "categoria" | "prezzo" | "disponibilita" | "foto", string>>;
  message?: string;
};

export type CarrelloState = { message?: string; success?: boolean };

export type CheckoutState = { message?: string };

export type StatoOrdineFormState = { message?: string; success?: boolean };

export type RecensioneState = { message?: string };

export type AssistenzaState = { message?: string };
