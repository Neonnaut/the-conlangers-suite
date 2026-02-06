import type { Output_Mode, Word_Step } from "./utils/types";

class Word {
   static output_mode: Output_Mode = "word-list";

   current_form: string;
   rejected: boolean;
   num_of_transformations: number;

   steps: Word_Step[];

   field_values: Record<string, string>;

   static fields: string[] = [];
   static field_delimiters: string[] = [];

   constructor(action: string | null, fields: Record<string, string>) {
      this.rejected = false; // This may be changed in transforms or when the word is ""
      this.current_form = fields["word"];
      this.num_of_transformations = 0;

      this.steps = [];

      this.field_values = fields;

      if (action === null) {
         this.steps.push({
            action: null,
            form: fields["word"],
            line_num: null,
         });
      } else {
         // The only action can be creating a word from a word-shape
         this.steps.push({
            action: action,
            form: fields["word"],
            line_num: null,
         });
      }
   }

   get_last_form(): string {
      // Gets canonical word. Use this when sorting the words
      return this.current_form;
   }

   get_word(): string {
      // Use this when creating the text
      const output: string[] = [];

      if (Word.output_mode == "debug") {
         for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];

            let form = step.form || "";
            let action = step.action || "";
            let line_num = step.line_num || "";

            if (form) {
               form = `⟨${form}⟩`;
            }
            if (form && action) {
               action = `${action} ➤ `;
            }
            if (line_num) {
               line_num = ` @ ln:${line_num}`;
            }

            output.push(`${action}${form}${line_num}`);
         }
         return output.join("\n");
      }
      if (Word.output_mode == "old-to-new") {
         const first_step = this.steps[0];
         let first_form = "";
         if (first_step) {
            first_form = first_step.form || "";
         }
         output.push(`${first_form} => ${this.current_form}`);
         return output.join("");
      }
      output.push(`${this.current_form}`);
      return output.join("");
   }

   private recombine_word_by_schema(values: Record<string, string>): string {
      let out = "";
      let i = 0;

      // first delimiter always comes first
      out += Word.field_delimiters[0] || "";

      while (i < Word.fields.length) {
         const field = Word.fields[i];
         let val = "";
         if (field === "word") {
            val = this.current_form;
         } else {
            val = values[field] || "�";
         }

         out += val;

         // delimiter after this field is at index i+1
         const next_delim = Word.field_delimiters[i + 1] || "�";
         out += next_delim;

         i++;
      }

      return out;
   }

   record_transformation(
      transformation: string,
      form: string,
      line_num: number,
   ): void {
      // WORD:
      // rejected, current_form, output_mode

      // STEPS:
      // transformation, form, line_num []

      this.steps.push({
         action: transformation,
         form: form,
         line_num: line_num + 1,
      });
      this.num_of_transformations++;
   }

   record_output() {
      let out: string = "";
      if (Word.field_delimiters.length > 0) {
         out = this.recombine_word_by_schema(this.field_values);
      } else {
         out = this.get_last_form();
      }
      this.steps.push({
         form: out,
         action: null,
         line_num: null,
      });
      this.current_form = out;
   }

   record_step(
      action: string | null,
      form: string | null,
      line_num: number | null,
   ) {
      this.steps.push({
         action: action,
         form: form,
         line_num: line_num,
      });
   }
}

export default Word;
