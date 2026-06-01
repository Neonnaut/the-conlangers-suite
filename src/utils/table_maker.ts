type Header = string[];

type RowEntry = {
   row: string;
   cells: string[]; // same length/order as header_col
};

type CellMap = RowEntry[];

export function table_md(cells: CellMap, header_col: Header): string {
   // Compute column widths
   const col_widths = new Map<string, number>();

   // Column headers
   for (const col of header_col) {
      col_widths.set(col, col.length);
   }

   // Cell values
   for (const entry of cells) {
      entry.cells.forEach((v, i) => {
         const col = header_col[i];
         const w = v.length;
         if (w > (col_widths.get(col) ?? 0)) col_widths.set(col, w);
      });
   }

   // Row header width
   const row_header_width = Math.max(...cells.map((e) => e.row.length), 0);

   const pad = (s: string, width: number) => s + " ".repeat(width - s.length);

   // Header row
   const header =
      `| ${pad("", row_header_width)} | ` +
      header_col.map((col) => pad(col, col_widths.get(col)!)).join(" | ") +
      " |";

   // Separator row
   const separator =
      `| ${"-".repeat(row_header_width)} | ` +
      header_col.map((col) => "-".repeat(col_widths.get(col)!)).join(" | ") +
      " |";

   // Body rows
   const body = cells
      .map((entry) => {
         const rowValues = entry.cells.map((v, i) =>
            pad(v, col_widths.get(header_col[i])!),
         );
         return `| ${pad(entry.row, row_header_width)} | ${rowValues.join(" | ")} |`;
      })
      .join("\n");

   return `${header}\n${separator}\n${body}`;
}

export function table_html(cells: CellMap, header_col: Header): string {
   const thead =
      `<thead><tr><th></th>` +
      header_col.map((col) => `<th>${escape_html(col)}</th>`).join("") +
      `</tr></thead>`;

   const tbody =
      `<tbody>` +
      cells
         .map((entry) => {
            const tds = entry.cells
               .map((v) => `<td>${escape_html(v)}</td>`)
               .join("");
            return `<tr><th>${escape_html(entry.row)}</th>${tds}</tr>`;
         })
         .join("") +
      `</tbody>`;

   return `<table>\n${thead}\n${tbody}\n</table>`;
}

function escape_html(s: string): string {
   return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
}
