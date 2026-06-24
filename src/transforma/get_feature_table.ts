export function get_feature_table(
   features: Map<string, { graphemes: string[] }>,
   my_graphemes: string[],
   rows: string[],
   columns: string[],
   secondary_order: string[],
): { headers: string[]; rows: { row: string; cells: string[] }[] } {
   const allowed = new Set(my_graphemes);

   const get = (f: string) => features.get(f)?.graphemes ?? [];

   const intersect = (a: string[], b: string[]) => {
      const b_set = new Set(b);
      return a.filter((g) => b_set.has(g) && allowed.has(g));
   };

   // Preload column sets
   const col_sets = new Map<string, string[]>();
   for (const c of columns) col_sets.set(c, get(c));

   // All feature names
   const all_feature_names = Array.from(features.keys());

   // Splitter features = everything except rows and columns
   const splitter_features = all_feature_names.filter(
      (f) => !rows.includes(f) && !columns.includes(f),
   );

   type row_spec = { base: string; label: string; set: string[] };
   const specs: row_spec[] = [];

   for (const base of rows) {
      const base_set = intersect(get(base), my_graphemes);
      if (base_set.length === 0) continue;

      // Compute signatures
      const signature_map = new Map<
         string,
         { sig: string[]; items: string[] }
      >();

      for (const g of base_set) {
         const sig: string[] = [];

         for (const f of splitter_features) {
            if (get(f).includes(g)) sig.push(f);
         }

         // Sort signature by custom secondary order
         sig.sort(
            (a, b) => secondary_order.indexOf(a) - secondary_order.indexOf(b),
         );

         const key = sig.join(" ");
         if (!signature_map.has(key)) {
            signature_map.set(key, { sig, items: [] });
         }
         signature_map.get(key)!.items.push(g);
      }

      const groups = Array.from(signature_map.values());

      // If only one group → do NOT qualify the row
      if (groups.length === 1) {
         specs.push({ base, label: base, set: groups[0].items });
      } else {
         // Multiple groups → qualify each subgroup
         for (const { sig, items } of groups) {
            const label = `${sig.join(" ")} ${base}`.trim();
            specs.push({ base, label, set: items });
         }
      }
   }

   // Build table rows
   const result_rows = specs.map((spec) => {
      const cells = columns.map((col) => {
         const items = intersect(spec.set, col_sets.get(col) ?? []);
         return items[0] ?? "";
      });
      return { row: spec.label, cells };
   });

   // Sort by base feature order
   result_rows.sort((a, b) => {
      const a_base = a.row.split(/\s+/).at(-1)!;
      const b_base = b.row.split(/\s+/).at(-1)!;
      return rows.indexOf(a_base) - rows.indexOf(b_base);
   });

   // Remove empty columns
   const keep_column = columns.map((_, col_index) =>
      result_rows.some((r) => r.cells[col_index] !== ""),
   );

   const filtered_headers = columns.filter((_, i) => keep_column[i]);

   const filtered_rows = result_rows.map((r) => ({
      row: r.row,
      cells: r.cells.filter((_, i) => keep_column[i]),
   }));

   return {
      headers: filtered_headers,
      rows: filtered_rows,
   };
}
