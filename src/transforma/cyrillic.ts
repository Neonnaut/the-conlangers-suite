const latin_to_cyrillic_code_map: Record<string, string> = {
   ya: "я",
   ye: "є",
   yi: "ї",
   yo: "ё",
   yu: "ю",

   a: "а",
   e: "е",
   i: "и",
   o: "о",
   u: "у",

   á: "ѧ",
   é: "э",
   í: "і",
   ó: "ɵ",
   ú: "ү",

   "'": "ь",
   è: "ъ",
   ì: "ы",
   ò: "ѣ",
   ù: "ұ",

   b: "б",
   v: "в",
   g: "г",
   d: "д",
   z: "з",
   k: "к",
   l: "л",
   m: "м",
   n: "н",
   p: "п",
   r: "р",
   s: "с",
   t: "т",
   f: "ф",
   h: "х",
   c: "ц",
   j: "й",
   w: "ў",

   tj: "ћ",
   gj: "ђ",
   zj: "ж",
   cj: "ч",
   dj: "џ",
   sj: "ш",
   lj: "љ",
   nj: "њ",

   nx: "ӈ",
   zx: "Ҙ",
   sx: "ҫ",
   gx: "ґ",
   qx: "ғ",
   jx: "ј",
   q: "ԛ",
   sjx: "щ",
};

// Build inverse map automatically
const cyrillic_to_latin_code_map: Record<string, string> = Object.fromEntries(
   Object.entries(latin_to_cyrillic_code_map).map(([latin, cyrillic]) => [
      cyrillic,
      latin,
   ]),
);

export function latin_to_cyrillic(input: string): string {
   let out = "";
   for (const char of input) {
      out += latin_to_cyrillic_code_map[char] ?? char;
   }
   return out;
}

export function cyrillic_to_latin(input: string): string {
   let out = "";
   for (const char of input) {
      out += cyrillic_to_latin_code_map[char] ?? char;
   }
   return out;
}
