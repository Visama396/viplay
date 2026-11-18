/** Shared shapes for the translation dictionaries. */
export type Vars = Record<string, string | number>;

export type PluralForms = {
  one?: string;
  few?: string;
  many?: string;
  other: string;
};

export type Messages = Record<string, string | PluralForms>;
