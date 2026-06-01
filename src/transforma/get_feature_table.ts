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
      const bSet = new Set(b);
      return a.filter((g) => bSet.has(g) && allowed.has(g));
   };

   // Preload column sets
   const colSets = new Map<string, string[]>();
   for (const c of columns) colSets.set(c, get(c));

   // All feature names
   const allFeatureNames = Array.from(features.keys());

   // Splitter features = everything except rows and columns
   const splitterFeatures = allFeatureNames.filter(
      (f) => !rows.includes(f) && !columns.includes(f),
   );

   type RowSpec = { base: string; label: string; set: string[] };
   const specs: RowSpec[] = [];

   for (const base of rows) {
      const baseSet = intersect(get(base), my_graphemes);
      if (baseSet.length === 0) continue;

      // Compute signatures
      const signatureMap = new Map<
         string,
         { sig: string[]; items: string[] }
      >();

      for (const g of baseSet) {
         const sig: string[] = [];

         for (const f of splitterFeatures) {
            if (get(f).includes(g)) sig.push(f);
         }

         // Sort signature by custom secondary order
         sig.sort(
            (a, b) => secondary_order.indexOf(a) - secondary_order.indexOf(b),
         );

         const key = sig.join(" ");
         if (!signatureMap.has(key)) {
            signatureMap.set(key, { sig, items: [] });
         }
         signatureMap.get(key)!.items.push(g);
      }

      const groups = Array.from(signatureMap.values());

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
   const resultRows = specs.map((spec) => {
      const cells = columns.map((col) => {
         const items = intersect(spec.set, colSets.get(col) ?? []);
         return items[0] ?? "";
      });
      return { row: spec.label, cells };
   });

   // Sort by base feature order
   resultRows.sort((a, b) => {
      const aBase = a.row.split(/\s+/).at(-1)!;
      const bBase = b.row.split(/\s+/).at(-1)!;
      return rows.indexOf(aBase) - rows.indexOf(bBase);
   });

   // Remove empty columns
   const keepColumn = columns.map((_, colIndex) =>
      resultRows.some((r) => r.cells[colIndex] !== ""),
   );

   const filteredHeaders = columns.filter((_, i) => keepColumn[i]);

   const filteredRows = resultRows.map((r) => ({
      row: r.row,
      cells: r.cells.filter((_, i) => keepColumn[i]),
   }));

   return {
      headers: filteredHeaders,
      rows: filteredRows,
   };
}
