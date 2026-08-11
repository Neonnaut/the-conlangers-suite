export const get_last = <T = never>(arr: ArrayLike<T> | null | undefined) =>
   // This thing fetches the last item of an array
   arr?.[arr.length - 1];

export const get_first = <T = never>(arr: ArrayLike<T> | null | undefined) =>
   // This thing fetches the first item of an array
   arr?.[0];

export const make_percentage = (input: string): number | null => {
   const num = Number(input);
   return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};

export function swap_first_last_items(array: string[]): string[] {
   if (array.length >= 2) {
      const first_item = array[0];
      const last_item_index = array.length - 1;
      const last_item = array[last_item_index];

      array[0] = last_item;
      array[last_item_index] = first_item;
   }
   return array;
}

export function reverse_items(array: string[]): string[] {
   return array.slice().reverse();
}

export function final_sentence(items: string[]): string {
   // This function takes an array of strings and returns a string
   // with commas and 'and' before the last item.
   const len = items.length;

   if (len === 0) return "";
   if (len === 1) return items[0];

   const all_but_last = items.slice(0, len - 1).join(", ");
   const last = items[len - 1];

   return `${all_but_last} and ${last}`;
}

export function recursive_expansion(
   input: string,
   mappings: Map<string, { content: string; line_num: number }>,
   enclose_in_brackets: boolean = false,
): string {
   const mapping_keys = [...mappings.keys()].sort(
      (a, b) => b.length - a.length,
   );

   const resolve_mapping = (str: string, history: string[] = []): string => {
      let result = "",
         i = 0;

      while (i < str.length) {
         let matched = false;

         for (const key of mapping_keys) {
            if (str.startsWith(key, i)) {
               if (history.includes(key)) {
                  result += "�";
               } else {
                  const entry = mappings.get(key);
                  const resolved = resolve_mapping(entry?.content || "", [
                     ...history,
                     key,
                  ]);
                  result += enclose_in_brackets ? `{${resolved}}` : resolved;
               }
               i += key.length;
               matched = true;
               break;
            }
         }

         if (!matched) result += str[i++];
      }

      return result;
   };

   return resolve_mapping(input);
}

export function graphemosis(
   input: string,
   canon_graphemes: string[],
): string[] {
   const tokens: string[] = [];
   let i = 0;
   while (i < input.length) {
      let matched = false;
      for (const g of canon_graphemes.sort((a, b) => b.length - a.length)) {
         if (input.startsWith(g, i)) {
            tokens.push(g);
            i += g.length;
            matched = true;
            break;
         }
      }
      if (!matched) {
         tokens.push(input[i]);
         i++;
      }
   }
   return tokens;
}
