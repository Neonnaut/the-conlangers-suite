// Parse transform grammar for
// TARGET, RESULT,
// EXCEPTION_BEFORE, EXCEPTION_AFTER
// CONDITION_BEFORE, CONDITION_AFTER
// GET LIST OF TOKENS

import Logger from "../logger.js";
import Escape_Mapper from "../escape_mapper.js";
import type { Token } from "../utils/types.js";
import { SYNTAX_CHARS_AND_CARET } from "../utils/types.js";
import type {
   Token_Stream_Mode,
   Associateme_Mapper,
   Pre_Grapheme_Unit,
} from "../utils/types.js";
import { graphemosis } from "../utils/utilities.js";

class Nesca_Grammar_Stream {
   public logger: Logger;
   public graphemorphs: string[];
   public associateme_mapper: Associateme_Mapper;
   private escape_mapper: Escape_Mapper;

   constructor(
      logger: Logger,
      graphemorphs: string[],
      associateme_mapper: Associateme_Mapper,
      escape_mapper: Escape_Mapper,
   ) {
      this.logger = logger;
      this.graphemorphs = graphemorphs;
      this.associateme_mapper = associateme_mapper;
      this.escape_mapper = escape_mapper;

      this.graphemorphs.sort((a, b) => b.length - a.length);
   }

   main_parser(
      stream: string,
      mode: Token_Stream_Mode,
      line_num: number,
   ): Token[] {
      let i = 0;
      const tokens: Token[] = [];

      if (stream.startsWith("@routine")) {
         const routine = stream.slice(8);
         return [
            { type: "routine", base: routine, mask: routine, routine: routine },
         ];
      } else if (stream === "^") {
         if (mode === "RESULT") {
            return [{ type: "deletion", mask: "^" }];
         } else if (mode === "TARGET") {
            return [{ type: "insertion", mask: "^" }];
         } else {
            this.logger.validation_error(
               `Unexpected character "${stream}" in mode ${mode}`,
               line_num,
            );
         }
      } else if (stream === "0") {
         if (mode !== "RESULT") {
            this.logger.validation_error(
               `Reject not allowed in ${mode}`,
               line_num,
            );
         }
         return [{ type: "reject", mask: "0" }];
      }

      while (i < stream.length) {
         let new_token: Token = {
            type: "pending",
            base: "",
            mask: "",
            min: 1,
            max: 1,
         };
         const char = stream[i];

         if (/\s/.test(char)) {
            i++;
            continue;
         }

         // Anythings-mark
         if (char === "%") {
            if (mode === "RESULT") {
               this.logger.validation_error(
                  `Anythings-mark not allowed in ${mode}`,
                  line_num,
               );
            }

            new_token = {
               type: "anythings-mark",
               mask: "%",
               min: 1,
               max: Infinity,
            };

            let look_ahead = i + 1;

            if (stream[look_ahead] !== "[") {
               this.logger.validation_error(
                  `Expected "[" after "%" for anythings-mark`,
                  line_num,
               );
            } else {
               look_ahead++;
               let garde_stream = "";

               //  Collect full stream inside brackets
               while (look_ahead < stream.length) {
                  const next_char = stream[look_ahead];
                  if (next_char === "]") break;
                  garde_stream += next_char;
                  look_ahead++;
               }

               if (look_ahead >= stream.length || stream[look_ahead] !== "]") {
                  this.logger.validation_error(`Unclosed blocker`, line_num);
               }

               // Parse stream into consume and blocked_by

               const consume: string[][] = [];
               const blocked_by: string[][] = [];

               const parts = garde_stream.split("|").map((part) => part.trim());

               if (parts.length > 2) {
                  throw new Error(
                     "Invalid anythings syntax: more than one '|' found",
                  );
               }

               const [consume_part, blocked_part] = parts;

               // Process consume part (split by commas)
               if (consume_part) {
                  const consume_groups = consume_part
                     .split(",")
                     .map((group) => group.trim())
                     .filter(Boolean);

                  for (const group of consume_groups) {
                     const restored_group =
                        this.escape_mapper.get_escaped_chars(group);
                     const graphemes = graphemosis(
                        restored_group,
                        this.graphemorphs,
                     ).filter(Boolean);

                     if (graphemes.length > 0) {
                        consume.push(graphemes);
                     }
                  }
               }

               // Process blocked_by part (if present)
               if (blocked_part) {
                  const blocked_groups = blocked_part
                     .split(",")
                     .map((group) => group.trim())
                     .filter(Boolean);

                  for (const group of blocked_groups) {
                     const restored_group =
                        this.escape_mapper.get_escaped_chars(group);
                     const graphemes = graphemosis(
                        restored_group,
                        this.graphemorphs,
                     ).filter(Boolean);

                     if (graphemes.length > 0) {
                        blocked_by.push(graphemes);
                     }
                  }
               }

               if (consume.length !== 0) {
                  new_token.consume = consume;
               }
               if (blocked_by.length !== 0) {
                  new_token.blocked_by = blocked_by;
               }

               look_ahead++; // Consume closing bracket
               i = look_ahead;
            }
         } else if (char === "*") {
            if (mode == "RESULT") {
               this.logger.validation_error(
                  `Wildcard not allowed in ${mode}`,
                  line_num,
               );
            }
            new_token = { type: "wildcard", mask: "*", min: 1, max: 1 };
            i++;
         } else if (char == "#") {
            if (mode !== "BEFORE" && mode !== "AFTER") {
               this.logger.validation_error(
                  `Word-boundary not allowed in ${mode}`,
                  line_num,
               );
            }
            if (i !== 0 && i + 1 !== stream.length) {
               this.logger.validation_error(
                  `Hash must be at the start or end of ${mode}`,
                  line_num,
               );
            }
            new_token = { type: "word-boundary", mask: "#", min: 1, max: 1 };
            tokens.push(new_token);
            i++;
            continue; // No modifiers allowed
         } else if (char == "$") {
            if (mode !== "BEFORE" && mode !== "AFTER") {
               this.logger.validation_error(
                  `Syllable-boundary not allowed in ${mode}`,
                  line_num,
               );
            }
            new_token = {
               type: "syllable-boundary",
               mask: "$",
               min: 1,
               max: 1,
            };
            tokens.push(new_token);
            i++;
            continue; // No modifiers allowed
         } else if (char === "&") {
            const look_ahead = i + 1;
            if (stream[look_ahead] === "T") {
               if (mode === "TARGET") {
                  this.logger.validation_error(
                     `Target-mark not allowed in ${mode}`,
                     line_num,
                  );
               }
               new_token = { type: "target-mark", mask: "&T", min: 1, max: 1 };
               i = look_ahead;
            } else if (stream[look_ahead] === "M") {
               if (mode === "TARGET") {
                  this.logger.validation_error(
                     `Metathesis-mark not allowed in "${mode}"`,
                     line_num,
                  );
               }
               new_token = {
                  type: "metathesis-mark",
                  mask: "&M",
                  min: 1,
                  max: 1,
               };
               i = look_ahead;
            } else if (stream[look_ahead] === "E") {
               if (mode !== "TARGET") {
                  this.logger.validation_error(
                     `Empty-mark only allowed in TARGET`,
                     line_num,
                  );
               }
               new_token = { type: "empty-mark", mask: "&E", min: 1, max: 1 };
               i = look_ahead;
            } else if (stream[look_ahead] === "=") {
               // Begins a reference capture of sequenced graphemes
               new_token = {
                  type: "reference-start-capture",
                  mask: "&=",
                  min: 1,
                  max: 1,
               };
               i = look_ahead + 1;
               tokens.push(new_token);
               continue; // No modifiers allowed
            } else {
               this.logger.validation_error(
                  `A "T", "M" or "=" did not follow "&" in ${mode}`,
                  line_num,
               );
            }

            i++;
         } else if (char === "=") {
            const look_ahead = i + 1;
            const digit = stream[look_ahead];
            if (/^[1-9]$/.test(digit)) {
               // It's a reference capture
               new_token = {
                  type: "reference-capture",
                  base: `=${digit}`,
                  mask: `=${digit}`,
                  key: digit,
                  min: 1,
                  max: 1,
               };
               tokens.push(new_token);
               i = look_ahead + 1;
               continue; // No modifiers allowed
            } else {
               this.logger.validation_error(
                  `Invalid reference capture syntax in ${mode}`,
                  line_num,
               );
            }
         } else if (/^[1-9]$/.test(char)) {
            // It's a reference-mark
            if (mode === "TARGET") {
               this.logger.validation_error(
                  "Reference-mark not allowed in TARGET",
                  line_num,
               );
            }

            new_token = {
               type: "reference-mark",
               base: char,
               mask: char,
               key: char,
               min: 1,
               max: 1,
            };
            i++;
         } else if (char === "~") {
            // It's a based-mark for null
            i++;
         } else if (
            // Syntax character used wrongly
            SYNTAX_CHARS_AND_CARET.includes(char)
         ) {
            this.logger.validation_error(
               `Unexpected syntax character "${char}" in ${mode}`,
               line_num,
            );
         } else {
            // GRAPHEME match
            const units = this.escape_mapper.get_escaped_stream(
               stream.slice(i),
            );
            const unit = units[0];
            let matched = false;

            for (const g of this.graphemorphs) {
               if (this.match_units(units, 0, g)) {
                  new_token = {
                     type: "grapheme",
                     mask: g,
                     base: g,
                     min: 1,
                     max: 1,
                  };
                  matched = true;

                  // raw advancement
                  let advance = 0;
                  for (let k = 0; k < g.length; k++) {
                     advance += units[k].raw_len;
                  }

                  i += advance;
                  break;
               }
            }

            if (!matched) {
               new_token = {
                  type: "grapheme",
                  base: unit.parsed,
                  mask: unit.parsed,
                  min: 1,
                  max: 1,
               };

               i += unit.raw_len;
            }
         }

         // -------------------------
         // APPLY MODIFIERS
         // -------------------------
         const modded = this.parse_modifiers(
            stream,
            i,
            new_token,
            mode,
            line_num,
         );
         tokens.push(modded.token);
         i = modded.next_i;
      }
      return tokens;
   }

   match_units(units: Pre_Grapheme_Unit[], ui: number, g: string): boolean {
      for (let k = 0; k < g.length; k++) {
         if (!units[ui + k]) return false;
         if (units[ui + k].parsed !== g[k]) return false;
      }
      return true;
   }

   parse_modifiers(
      stream: string,
      i: number,
      token: Token,
      mode: Token_Stream_Mode,
      line_num: number,
   ): { token: Token; next_i: number } {
      if (!("min" in token) || !("max" in token)) {
         return { token, next_i: i };
      }

      while (true) {
         const char = stream[i];

         // No more modifiers → stop
         if (char !== ":" && char !== "+" && char !== "?" && char !== "~") {
            break;
         }

         // ":" exactly twice
         if (char === ":") {
            token.min = 2;
            token.max = 2;
            i++;
            continue;
         }

         // "+" one or more
         if (char === "+") {
            if (mode === "RESULT") {
               this.logger.validation_error(
                  `Unbounded quantifier not allowed in ${mode}`,
                  line_num,
               );
            }
            token.min = 1;
            token.max = Infinity;
            i++;
            continue;
         }

         // "?[min,max]"
         if (char === "?") {
            let look = i + 1;

            if (stream[look] !== "[") {
               this.logger.validation_error(
                  `Expected "[" after "?" for quantifier`,
                  line_num,
               );
            }

            look++;
            let quant = "";
            while (look < stream.length && stream[look] !== "]") {
               quant += stream[look++];
            }

            if (stream[look] !== "]") {
               this.logger.validation_error(`Unclosed quantifier`, line_num);
            }

            const parts = quant.split(",");

            if (parts.length === 1) {
               const n = parseInt(parts[0], 10);
               if (isNaN(n)) {
                  this.logger.validation_error(
                     `Invalid quantifier value: "${parts[0]}"`,
                     line_num,
                  );
               }
               token.min = n;
               token.max = n;
            } else if (parts.length === 2) {
               const [minStr, maxStr] = parts;
               const min = minStr === "" ? 1 : parseInt(minStr, 10);
               const max = maxStr === "" ? Infinity : parseInt(maxStr, 10);

               if (minStr !== "" && isNaN(min)) {
                  this.logger.validation_error(
                     `Invalid min value: "${minStr}"`,
                     line_num,
                  );
               }
               if (maxStr !== "" && max !== Infinity && isNaN(max)) {
                  this.logger.validation_error(
                     `Invalid max value: "${maxStr}"`,
                     line_num,
                  );
               }
               if (max === Infinity && mode === "RESULT") {
                  this.logger.validation_error(
                     `In ${mode}, "${token.mask}" cannot be reproduced an infinite amount of times`,
                     line_num,
                  );
               }

               token.min = min;
               token.max = max;
            } else {
               this.logger.validation_error(
                  `Invalid quantifier format: "${quant}"`,
                  line_num,
               );
            }

            if (token.max !== Infinity && token.min > token.max) {
               this.logger.validation_error(
                  `Invalid quantifier: min "${token.min}" cannot be greater than max "${token.max}"`,
                  line_num,
               );
            }

            i = look + 1;
            continue;
         }

         // "~" based-mark
         if (char === "~") {
            if (token.type !== "grapheme") {
               this.logger.validation_error(
                  `Based-mark only allowed after grapheme token`,
                  line_num,
               );
            } else {
               const location = this.find_base_location(
                  this.associateme_mapper,
                  token.base,
               );
               if (!location) {
                  this.logger.validation_error(
                     `Grapheme "${token.base}" with a based-mark was not an associateme base`,
                     line_num,
                  );
               } else {
                  const [entry_id, base_id] = location;
                  token.association = {
                     entry_id,
                     base_id,
                     variant_id: 0,
                     is_target: mode === "TARGET",
                  };
               }
            }

            i++;
            continue;
         }
      }

      return { token, next_i: i };
   }

   cluster_parser(
      stream: string,
      mode: Token_Stream_Mode,
      line_num: number,
   ): Token[] {
      let i = 0;
      const tokens: Token[] = [];

      if (stream === "^") {
         if (mode === "RESULT") {
            return [{ type: "deletion", mask: "^" }];
         } else {
            this.logger.validation_error(
               `Unexpected character "${stream}" in ${mode}`,
               line_num,
            );
         }
      } else if (stream === "0") {
         if (mode !== "RESULT") {
            this.logger.validation_error(
               `Reject not allowed in ${mode}`,
               line_num,
            );
         }
         return [{ type: "reject", mask: "0" }];
      }

      while (i < stream.length) {
         let new_token: Token = {
            type: "pending",
            mask: "",
            base: "",
            min: 1,
            max: 1,
         };
         const char = stream[i];

         if (/\s/.test(char)) {
            i++;
            continue;
         }

         if (char === "^" || char === "0") {
            this.logger.validation_error(
               `Unexpected character "${char}" in cluster-field`,
               line_num,
            );
         }

         // GRAPHEME match
         const escaped_stream = this.escape_mapper.get_escaped_chars(stream);
         let matched = false;
         for (const g of this.graphemorphs) {
            if (escaped_stream.startsWith(g, i)) {
               new_token = {
                  type: "grapheme",
                  base: g,
                  mask: g,
                  min: 1,
                  max: 1,
               };
               i += g.length;
               matched = true;
               break;
            }
         }
         if (!matched) {
            new_token = {
               type: "grapheme",
               base: escaped_stream[i],
               mask: escaped_stream[i],
               min: 1,
               max: 1,
            };
            i++;
         }

         if (new_token.type !== "pending") {
            tokens.push(new_token);
         }
      }
      return tokens;
   }

   recast_category_parser(
      base: string,
      graphemes: string[],
      weights: number[],
      modify: string,
      line_number: number,
   ): Token {
      const new_token: Token = {
         type: "recast-category",
         base: base,
         mask: base,
         graphemes: graphemes,
         weights: weights,
         min: 1,
         max: 1,
      };

      const modded = this.parse_modifiers(
         modify,
         0,
         new_token,
         "RESULT",
         line_number,
      );

      if (modded.next_i != modify.length) {
         this.logger.validation_error(
            "The RESULT of a recast transform must be a category with optional modifiers",
            line_number,
         );
      }

      return modded.token;
   }

   find_base_location(
      mapper: Associateme_Mapper,
      grapheme: string,
   ): [number, number] | null {
      for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
         const entry = mapper[entry_id];
         for (let base_id = 0; base_id < entry.bases.length; base_id++) {
            if (entry.bases[base_id] === grapheme) {
               return [entry_id, base_id];
            }
         }
      }
      return null; // not found
   }
}

export default Nesca_Grammar_Stream;
