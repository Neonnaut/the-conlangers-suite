import Logger from "../logger";
import { SYNTAX_CHARS } from "../utils/types";

export class Supra_Builder {
   private logger: Logger;
   private weights: Record<number, number | "s">;
   private content: Record<number, string>;
   public id_counter: number;

   constructor(logger: Logger) {
      this.logger = logger;
      this.weights = {};
      this.content = {};
      this.id_counter = 1;
   }

   process_string(input: string, wordshape_line_num: number): string {
      // Match [ ... ] with optional |*n at the end
      const token_regex = /(?<!&)\[([^\]]*)\]/g;

      return input.replace(token_regex, (full_match, content) => {
         // Split into "main content" and optional "|*n"
         const pipe_match = content.match(/^(.*?)(?:\|\*(\d+(?:\.\d+)?|s))?$/);

         if (!pipe_match) {
            this.logger.validation_error(
               `Invalid supra-set item "${full_match}" -- expected forms like "[...]" or "[...|*8]"`,
               wordshape_line_num,
            );
         }

         const main_content = pipe_match[1]; // everything before |*n
         const raw_weight = pipe_match[2]; // the number or "s" after |*

         if (SYNTAX_CHARS.some((char) => main_content.includes(char))) {
            this.logger.validation_error(
               `Invalid supra-set item "${full_match}" -- cannot use syntax characters as content`,
               wordshape_line_num,
            );
         }

         const weight =
            raw_weight === "s" ? "s" : raw_weight ? Number(raw_weight) : 1;

         const id = this.id_counter++;
         this.weights[id] = weight;
         this.content[id] = main_content;

         return `[${id}]`;
      });
   }

   extract_content_and_weights(input: string): [string[], (number | "s")[]] {
      const id_regex = /(?<!&)\[(\d+)\]/g;
      const ids: string[] = [];
      const weights: (number | "s")[] = [];

      let match: RegExpExecArray | null;
      while ((match = id_regex.exec(input)) !== null) {
         const id = Number(match[1]);

         if (!(id in this.content) || !(id in this.weights)) {
            this.logger.validation_error(`Missing data for ID "${id}"`, null);
         }

         ids.push(id.toString());
         weights.push(this.weights[id]);
      }

      return [ids, weights];
   }

   replace_letter_and_clean(input: string, target_ID: number): string {
      const id_regex = /(?<!&)\[(\d+)\]/g;

      return input.replace(id_regex, (_match, id_str) => {
         const id = Number(id_str);

         // Safety check
         if (!(id in this.content)) {
            this.logger.validation_error(
               `Unknown ID "${id}" found in input`,
               null,
            );
         }

         // Keep only the target letter
         return id === target_ID ? `${this.content[id]}` : "";
      });
   }

   replace_for_mask(input: string): string {
      // Only match IDs inside &[...]
      const id_regex = /(?<!&)\[(\d+)\]/g;

      return input.replace(id_regex, (_match, id_str) => {
         const id = Number(id_str);

         // Safety check: must exist in BOTH objects
         if (!(id in this.content) || !(id in this.weights)) {
            this.logger.validation_error(
               `Unknown ID "${id}" found in input`,
               null,
            );
         }

         const content = this.content[id];
         const weight = this.weights[id];

         // Preserve &[ ... ] framing
         return `&[${content}|*${weight}]`;
      });
   }

   get_weights(): Record<number, number | "s"> {
      return this.weights;
   }

   get_content(): Record<number, string> {
      return this.content;
   }
}

export default Supra_Builder;
