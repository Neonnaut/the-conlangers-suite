import Logger from "./logger";
import type Word from "./word";

export function collate_words_by_current_form(
   logger: Logger,
   word_objects: Word[],
   alphabet: string[],
   invisible: string[],
): Word[] {
   // 1. build key list and buckets for duplicates
   const keys: string[] = [];
   const buckets: Map<string, Word[]> = new Map();

   for (let i = 0; i < word_objects.length; i++) {
      const w = word_objects[i];
      const key = w.current_form;

      keys.push(key);

      const existing = buckets.get(key);
      if (existing) {
         existing.push(w);
      } else {
         buckets.set(key, [w]);
      }
   }

   // 2. sort keys using existing collator (string[] → string[])
   const sorted_keys = collator(logger, keys, alphabet, invisible);

   // 3. rebuild sorted word list by draining buckets
   const sorted_words: Word[] = [];

   for (let i = 0; i < sorted_keys.length; i++) {
      const key = sorted_keys[i];
      const bucket = buckets.get(key);

      if (!bucket || bucket.length === 0) {
         // should not happen if buckets and keys are in sync
         continue;
      }

      const w = bucket.shift() as Word; // take next word with this key
      sorted_words.push(w);
   }

   return sorted_words;
}

export function collator(
   logger: Logger,
   words: string[],
   custom_alphabet: string[],
   invisible: string[] = [],
): string[] {
   if (custom_alphabet.length === 0) {
      if (invisible.length == 0) {
         return words.sort(Intl.Collator().compare);
      } else {
         const invisible_set = new Set<string>(invisible);
         const collator = Intl.Collator();

         const stripped_words = words.map((w) => ({
            original: w,
            stripped: strip_invisible(w, invisible_set),
         }));

         return stripped_words
            .sort((a, b) => collator.compare(a.stripped, b.stripped))
            .map((entry) => entry.original);
      }
   }

   custom_alphabet.push("�");

   const order_map = new Map<string, number>();
   custom_alphabet.forEach((char, index) => order_map.set(char, index));

   const invisible_set = new Set<string>(invisible);
   const unknown_set = new Set<string>();

   function tokenize(input: string): string[] {
      const tokens: string[] = [];
      const graphemes = Array.from(order_map.keys())
         .concat(Array.from(invisible_set)) // So invisible graphemes get matched as units
         .sort((a, b) => b.length - a.length);

      let i = 0;
      while (i < input.length) {
         let matched = false;

         for (const g of graphemes) {
            if (input.startsWith(g, i)) {
               tokens.push(g);
               i += g.length;
               matched = true;
               break;
            }
         }

         if (!matched) {
            tokens.push(input[i]);
            i += 1;
         }
      }

      return tokens;
   }

   function custom_compare(a: string, b: string): number {
      const aTokens = tokenize(a).filter((t) => !invisible_set.has(t));
      const bTokens = tokenize(b).filter((t) => !invisible_set.has(t));

      for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
         const aTok = aTokens[i];
         const bTok = bTokens[i];
         if (aTok === undefined) return -1;
         if (bTok === undefined) return 1;

         const aIndex = order_map.get(aTok);
         const bIndex = order_map.get(bTok);

         if (aIndex === undefined) unknown_set.add(aTok);
         if (bIndex === undefined) unknown_set.add(bTok);

         if ((aIndex ?? Infinity) !== (bIndex ?? Infinity)) {
            return (aIndex ?? Infinity) - (bIndex ?? Infinity);
         }
      }

      return 0;
   }

   function strip_invisible(word: string, invisible_set: Set<string>): string {
      const graphemes = Array.from(invisible_set).sort(
         (a, b) => b.length - a.length,
      );
      let result = "";
      let i = 0;

      while (i < word.length) {
         let matched = false;
         for (const g of graphemes) {
            if (word.startsWith(g, i)) {
               i += g.length;
               matched = true;
               break;
            }
         }
         if (!matched) {
            result += word[i];
            i += 1;
         }
      }

      return result;
   }

   const sorted = [...words].sort(custom_compare);

   if (unknown_set.size > 0) {
      logger.warn(
         `The custom order stated in 'alphabet' was ignored because words had unknown graphemes: '${Array.from(unknown_set).join(", ")}' missing from 'alphabet'`,
      );
      return words.sort(Intl.Collator().compare);
   }

   return sorted;
}

export default collator;
