import { SYNTAX_CHARS, Pre_Grapheme_Unit } from "./utils/types";

const named_escape_map: Record<string, string> = {
   "&[Space]": "\u0020",
   "&[Tab]": "\u0009",
   "&[Newline]": "\u000A",
   "&[Acute]": "\u0301",
   "&[DoubleAcute]": "\u030B",
   "&[Grave]": "\u0300",
   "&[DoubleGrave]": "\u030F",
   "&[Circumflex]": "\u0302",
   "&[Caron]": "\u030C",
   "&[Breve]": "\u0306",
   "&[BreveBelow]": "\u032E",
   "&[InvertedBreve]": "\u0311",
   "&[InvertedBreveBelow]": "\u032F",
   "&[TildeAbove]": "\u0303",
   "&[Tilde]": "\u0303",
   "&[TildeBelow]": "\u0330",
   "&[Macron]": "\u0304",
   "&[MacronBelow]": "\u0331",
   "&[MacronBelowStandalone]": "\u02D7",
   "&[Dot]": "\u0307",
   "&[DotBelow]": "\u0323",
   "&[Diaeresis]": "\u0308",
   "&[DiaeresisBelow]": "\u0324",
   "&[Ring]": "\u030A",
   "&[RingBelow]": "\u0325",
   "&[Horn]": "\u031B",
   "&[Hook]": "\u0309",
   "&[CommaAbove]": "\u0313",
   "&[Comma]": "\u0313",
   "&[CommaBelow]": "\u0326",
   "&[Cedilla]": "\u0327",
   "&[Ogonek]": "\u0328",
   "&[VerticalLineBelow]": "\u0329",
   "&[VerticalLine]": "\u0329",
   "&[VerticalLineAbove]": "\u030D",
   "&[DoubleVerticalLineBelow]": "\u0348",
   "&[PlusSignBelow]": "\u031F",
   "&[PlusSignStandalone]": "\u02D6",
   "&[uptackBelow]": "\u031D",
   "&[UpTackStandalone]": "\u02D4",
   "&[LeftTackBelow]": "\u0318",
   "&[rightTackBelow]": "\u0319",
   "&[DownTackBelow]": "\u031E",
   "&[DownTackStandalone]": "\u02D5",
   "&[BridgeBelow]": "\u032A",
   "&[BridgeAbove]": "\u0346",
   "&[Bridge]": "\u0346",
   "&[InvertedBridgeBelow]": "\u033A",
   "&[SquareBelow]": "\u033B",
   "&[SeagullBelow]": "\u033C",
   "&[LeftBracketBelow]": "\u0349",
};

class Escape_Mapper {
   private map: Map<string, { mask: string; content: string }>;
   public counter: number;

   constructor() {
      this.map = new Map();
      this.counter = 1;
   }

   // ⟪ ⟫

   private make_placeholder(mask: string, content: string): string {
      const place = `;${this.counter};`;
      this.map.set(place, { mask, content });
      this.counter++;
      return place;
   }

   // Escape \x  → &[n]
   // mask = "\x"
   // content = "x"
   set_backslash_escape(input: string): string {
      const reverse = new Map<string, string>();

      return input.replace(/\\(.)/g, (_, char) => {
         const mask = `\\${char}`;
         if (reverse.has(mask)) return reverse.get(mask)!;

         const place = this.make_placeholder(mask, char);
         reverse.set(mask, place);
         return place;
      });
   }

   // Replace named escapes with named escape map
   // mask = "&[Grave]"
   // content = diacritic
   get_named_escape(input: string): string {
      return input.replace(/&\[[A-Za-z]+\]/g, (m) => {
         const content = named_escape_map[m];
         if (!content) return m;

         // Replace with placeholder
         return this.make_placeholder(m, content);
      });
   }

   // Escape syntax chars → &[n]
   // mask = the literal char
   // content = the literal char
   set_special_char_escape(input: string): string {
      const special = new Set(SYNTAX_CHARS);
      const reverse = new Map<string, string>();

      let out = "";
      let i = 0;

      while (i < input.length) {
         // Detect existing &[n]
         if (input[i] === "&" && input[i + 1] === "[") {
            const end = input.indexOf("]", i + 2);
            if (end !== -1) {
               const token = input.slice(i, end + 1);
               if (this.map.has(token)) {
                  out += token;
                  i = end + 1;
                  continue;
               }
            }
         }

         // Detect ;n; pattern (digits between semicolons)
         if (input[i] === ";") {
            const end = input.indexOf(";", i + 1);
            if (end !== -1) {
               const inner = input.slice(i + 1, end);
               if (/^\d+$/.test(inner)) {
                  // It's a ;number; → keep as-is
                  out += input.slice(i, end + 1);
                  i = end + 1;
                  continue;
               }
            }
         }

         const char = input[i];

         if (!special.has(char)) {
            out += char;
         } else {
            if (reverse.has(char)) {
               out += reverse.get(char)!;
            } else {
               const place = this.make_placeholder(char, char);
               reverse.set(char, place);
               out += place;
            }
         }

         i++;
      }

      return out;
   }

   // Restore &[n] → content
   get_escaped_chars(input: string): string {
      return input.replace(/;\d+;/g, (m) => {
         const entry = this.map.get(m);
         return entry ? entry.content : m;
      });
   }

   // Restore &[n] → mask
   get_mask_stream(input: string): string {
      return input.replace(/;\d+;/g, (m) => {
         const entry = this.map.get(m);
         return entry ? entry.mask : m;
      });
   }

   has_stray_escape(input: string): boolean {
      const regex = /&\[[^\]]*\]?/g;
      let match;

      while ((match = regex.exec(input)) !== null) {
         const token = match[0];
         if (this.map.has(token)) continue;
         return true;
      }
      return false;
   }

   get_escaped_stream(stream: string): Pre_Grapheme_Unit[] {
      const units: Pre_Grapheme_Unit[] = [];
      let i = 0;

      while (i < stream.length) {
         if (stream[i] === ";") {
            const end = stream.indexOf(";", i + 1);

            if (end !== -1) {
               const raw = stream.slice(i, end + 1);
               const entry = this.map.get(raw);

               const parsed = entry ? entry.content : raw;
               const mask = entry ? entry.mask : raw;

               units.push({
                  parsed,
                  raw_len: raw.length,
                  raw,
                  mask,
               });

               i = end + 1;
               continue;
            }
         }

         units.push({
            parsed: stream[i],
            raw_len: 1,
            raw: stream[i],
            mask: stream[i],
         });

         i++;
      }

      return units;
   }
}

export default Escape_Mapper;
