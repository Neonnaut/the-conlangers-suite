export type App = "vocabug" | "nesca";

export type Log = {
   payload: string;
   errors: string[];
   warnings: string[];
   infos: string[];
   diagnostics: string[];
};

export type Association = {
   entry_id: number;
   base_id: number;
   variant_id: number;
   is_target: boolean;
};

export type Schema = {
   fields: string[];
   delimiters: string[];
};

export type Word_Step = {
   action: string | null;
   form: string | null;
   line_num: number | null;
};

export type Token =
   | {
        type: "pending";
        mask: string;
        base: string;
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "grapheme"; // ch, a, \*
        mask: string;
        base: string;
        min: number;
        max: number | typeof Infinity;
        named_reference_bind?: string;
        association?: Association;
     }
   | {
        type: "wildcard"; // *
        mask: "*";
        min: number;
        max: number | typeof Infinity;
        named_reference_bind?: string;
     }
   | {
        type: "anythings-mark"; // &
        mask: "%";
        min: number;
        max: number | typeof Infinity;
        consume?: string[][];
        blocked_by?: string[][];
     }
   | {
        type: "deletion"; // ^
        mask: "^";
     }
   | {
        type: "insertion"; // ^
        mask: "^";
     }
   | {
        type: "reject"; // 0
        mask: "0";
     }
   | {
        type: "word-boundary"; // #
        mask: "#";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "syllable-boundary"; // #
        mask: "$";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "routine"; // @routine
        mask: string;
        base: string;
        routine: string;
        // the routine
     }
   | {
        type: "target-mark";
        mask: "&T";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "metathesis-mark";
        mask: "&M";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "empty-mark";
        mask: "&E";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "based-mark";
        mask: "~";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-start-capture";
        mask: "&=";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-capture";
        mask: string;
        base: string;
        key: string;
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-mark";
        mask: string;
        base: string;
        key: string;
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "recast-category";
        mask: string;
        base: string;
        graphemes: string[];
        weights: number[];
        min: number;
        max: number | typeof Infinity;
        named_reference_bind?: string;
        association?: Association;
     };

export type Transform = {
   t_type: "rule" | "cluster-field" | Routine | "recast";
   target: Token[][];
   result: Token[][];
   conditions: { before: Token[]; after: Token[] }[];
   exceptions: { before: Token[]; after: Token[] }[];
   chance: number | null;
   line_num: number;
};

export type Transform_Pending = {
   t_type: "rule" | "cluster-field" | Routine | "recast";
   target: string;
   result: string;
   conditions: string[];
   exceptions: string[];
   chance: number | null;
   line_num: number;
};

export type Stage = {
   name: string;
   transforms: Transform[];
};

export type Sub_Stage = {
   name: string;
   transforms: Transform[];
};

export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

export type Output_Mode = "word-list" | "debug" | "paragraph" | "old-to-new";

export type Distribution = "gusein-zade" | "zipfian" | "shallow" | "flat";

export type Directive =
   | "categories"
   | "words"
   | "units"
   | "alphabet"
   | "invisible"
   | "graphemes"
   | "syllable-boundaries"
   | "features"
   | "feature-field"
   | "stage"
   | "letter-case-field"
   | "schema"
   | "note"
   | "none";

export const Directive_List = [
   "categories",
   "words",
   "units",
   "alphabet",
   "invisible",
   "graphemes",
   "syllable-boundaries",
   "features",
   "feature-field",
   "stage",
   "letter-case-field",
   "schema",
   "note",
];

export const Directive_Using_Escape = [
   "categories",
   "words",
   "units",
   "alphabet",
   "invisible",
   "graphemes",
   "syllable-boundaries",
   "features",
   "feature-field",
   "stage",
   "letter-case-field",
];

export type Routine =
   | "decompose"
   | "compose"
   | "capitalise"
   | "decapitalise"
   | "to-uppercase"
   | "to-lowercase"
   | "xsampa-to-ipa"
   | "ipa-to-xsampa"
   | "latin-to-hangul"
   | "hangul-to-latin"
   | "greek-to-latin"
   | "latin-to-greek"
   | "cyrillic-to-latin"
   | "latin-to-cyrillic"
   | "reverse";

export const SYNTAX_CHARS = [
   "<",
   ">",
   "{",
   "}",
   "[",
   "]",
   "(",
   ")",
   "@",
   "⇒",
   "→",
   "->",
   ">>",
   "_",
   "0",
   "!",
   "#",
   "$",
   "+",
   "?",
   ":",
   "*",
   "&",
   "%",
   "|",
   "~",
   "=",
   "1",
   "2",
   "3",
   "4",
   "5",
   "6",
   "7",
   "8",
   "9",
];

export const SYNTAX_BRACKETS = ["<", ">", "{", "}", "[", "]", "(", ")"];

export const SYNTAX_CHARS_AND_CARET: string[] = [...SYNTAX_CHARS, "^"];

export const SYNTAX_CHARS_CAT_KEY: string[] = [...SYNTAX_CHARS, "^", ",", "\\"];

export type Pre_Grapheme_Unit = {
   parsed: string;
   raw_len: number;
   raw: string;
   mask: string;
};

export type Carryover_Associations = {
   entry_id: number;
   base_id: number;
   variant_id: number;
}[];

interface Associateme_Entry {
   bases: string[]; // e.g. ["a","i","u"]
   variants: string[][]; // includes bases as first variant, e.g. [ ["a","i","u"], ["á","í","ú"], ["à","ì","ù"] ]
}

export type Associateme_Mapper = Associateme_Entry[];
