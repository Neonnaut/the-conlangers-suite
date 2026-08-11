/**
 * @name Xcode
 */
import { tags as t } from "@lezer/highlight";

import { createTheme, type CreateThemeOptions } from "@uiw/codemirror-themes";
import { EditorView } from "codemirror";

const colour = {

   darkthemetext: "#eeeeeeff",
   lightthemetext: "#000000",
   warmthemetext: "#181e20ff;",

   red: "#ff7a7a", // dark; directive and flaggy
   orange: "#f8a561", // dark; cat-fea
   yellow: "#ffee90", // dark; escape
   blue: "#a6d3f7", // dark; link
   greygreen: "#b0b7b1", // dark; comment
   pink: "#e799fa", // dark; regexp
   cyan: "#44ebd0ff", // dark; operator
   green: "#8eea7eff", // dark; weight, plussign, value

   royal: "#230682", // Light; directive and flaggy
   brown: "#998500", // Light; cat-fea
   darkred: "#c8302d", // Light; escape
   darkblue: "#0066b9ff", // Light; Link
   darkgreen: "#2a8b23", // Light; comment
   darkpink: "#b800b2", // Light; Regexp
   darkcyan: "#3690a0", // Light; operator, weight, plussign, value
};



export const defaultSettingsXcodeDark: CreateThemeOptions["settings"] = {
   background: "#23272e",
   foreground: "#23272e",
   gutterBackground: "#1e2227",
   caret: "#ffffff",
   selection: "#b4afff35",
   selectionMatch: "#265906b8",
   lineHighlight: "transparent"
};

const Darky = EditorView.theme({
   "&": {
      fontSize: "11pt",
      color: colour.darkthemetext,
      font:"'JetBrains Mono', monospace"
   },
   ".cm-gutters": {
      color: "#777777",
      minWidth: "25.6px",
      userSelect: "none"
   },
   ".cm-gutter": {
      minWidth: "100%"
   },
   ".cm-activeLineGutter": {
      backgroundColor: "#ffffff14",
      color: "#dddddd"
   },
   "&.cm-editor": {
      colorScheme: "dark;",
      border: "1px solid #555555;",
      height: "100%;",
      width: "100%;"
   },
   "&.cm-editor.cm-focused": {
      outline: "none",
      border: "1px dotted #3295a8;"
   },
   ".cm-matchingBracket, &.cm-editor.cm-focused .cm-matchingBracket": {
      backgroundColor: "#00be6845", // Optional highlight background
   },
   "@media only screen and (max-width: 320px)": {
      ".cm-gutters": {
         display: "none!important"
      }
   }

}, { dark: true });

export const xcodeDarkStyle: CreateThemeOptions["styles"] = [
   { tag: t.variableName, color: colour.darkthemetext },

   // Comment / GREEN / #
   { tag: t.comment, color: colour.greygreen },

   // Escape char / YELLOW
   { tag: t.escape, color: colour.yellow }, 

   // Directive / RED / words: alphabet: etc.
   { tag: t.meta, color: colour.red, fontWeight: "bold" },

   // ...
   { tag: t.name, color: colour.red },

   // LIGHT BLUE / commas, equals sign, colon
   { tag: t.link, color: colour.blue , fontWeight: "bold" },
   
   // CYAN / 0, ->, +, -
   { tag: t.operator, color: colour.cyan },

   // PINK / #, +, *, (, {, [
   { tag: t.regexp, color: colour.pink },

   // ORANGE / Categories
   { tag: t.tagName, color: colour.orange },

   // Weights
   { tag: t.strong, color: colour.green, fontStyle: "italic" },

   // distribution etc
   { tag: t.attributeName, color: colour.green },

   // + sign
   { tag: t.bitwiseOperator, color: colour.green, fontweight: "bold" },

   // - sign
   { tag: t.punctuation, color: colour.pink, fontweight: "bold" }
];

export const xcodeDarkInit = (options?: Partial<CreateThemeOptions>) => {
   const { theme = "dark", settings = {}, styles = [] } = options || {};
   return createTheme({
      theme: theme,
      settings: {
         ...defaultSettingsXcodeDark,
         ...settings,
      },
      styles: [...xcodeDarkStyle, ...styles],
   });
};

export const defaultSettingsXcodeLight: CreateThemeOptions["settings"] = {
   background: "#ffffff",
   foreground: "#3d3d3d",
   selection: "#d6ecffff",
   selectionMatch: "#fae098",
   gutterBackground: "#eee",
   gutterForeground: "#afafaf",
   lineHighlight: "transparent",
};

const Lighty = EditorView.theme({
   "&": {
      fontSize: "11pt",
      color: "#000000"
   },
   ".cm-gutters": {
      color: "#999999",
      minWidth: "25.6px",
      userSelect: "none"
   },
   ".cm-gutter": {
      minWidth: "100%"
   },
   ".cm-activeLineGutter": {
      backgroundColor: "#ffffff",
      color: "#666666"
   },
   "&.cm-editor": {
      border: "1px solid #aaaaaa;",
      height: "100%;",
      width: "100%;"
   },
   "&.cm-editor.cm-focused": {
      outline: "none",
      border: "1px dotted #001299;"
   },
   ".cm-matchingBracket, &.cm-editor.cm-focused .cm-matchingBracket": {
      backgroundColor: "#00be681e", // Optional highlight background
   },
   "@media only screen and (max-width: 200px)": {
      ".cm-gutters": {
         display: "none!important"
      }
   }
});

export const xcodeLightStyle: CreateThemeOptions["styles"] = [
   { tag: t.variableName, color: "#000000" },

   // Comment / GREEN / #
   { tag: t.comment, color: colour.darkgreen},

   // Escape char / YELLOW / 
   { tag: t.escape, color: colour.brown},

   // Directive / RED / words: alphabet: etc.
   { tag: t.meta, color: colour.royal, fontWeight: "bold" },

   // things...: etc.
   { tag: t.name, color: colour.royal },

   // LIGHT BLUE / commas, equals sign, colon
   { tag: t.link, color: colour.darkblue , fontWeight: "bold" }, 

   // CYAN / 0, ^
   { tag: t.operator, color: colour.royal}, 

   // PINK / #, +, *, (, {, [
   { tag: t.regexp, color: colour.darkpink },

   // Red / Categories
   { tag: t.tagName, color: colour.darkred },

   // Weights
   { tag: t.strong, color: colour.darkcyan, fontStyle: "italic" },

   // distribution etc
   { tag: t.attributeName, color: colour.darkcyan },

   // + sign
   { tag: t.bitwiseOperator, color: colour.darkgreen, fontweight: "bold" },

   // - sign
   { tag: t.punctuation, color: colour.darkpink, fontweight: "bold" }

];

export function xcodeLightInit(options?: Partial<CreateThemeOptions>) {
   const { theme = "light", settings = {}, styles = [] } = options || {};
   return createTheme({
      theme: theme,
      settings: {
         ...defaultSettingsXcodeLight,
         ...settings,
      },
      styles: [...xcodeLightStyle, ...styles],
   });
}

export const defaultSettingsXcodeWarm: CreateThemeOptions["settings"] = {
   background: "#f5f5f5ff",
   foreground: "#3d3d3d",
   selection: "#d6ecffff",
   selectionMatch: "#fae098",
   gutterBackground: "#eae8e4ff",
   gutterForeground: "#afafaf",
   lineHighlight: "transparent",
};

const Warmy = EditorView.theme({
   "&": {
      fontSize: "11pt",
      color: "#181e20ff;"
   },
   ".cm-gutters": {
      color: "#8f8f8fff",
      minWidth: "25.6px",
      userSelect: "none"
   },
   ".cm-gutter": {
      minWidth: "100%"
   },
   ".cm-activeLineGutter": {
      backgroundColor: "#ffffff",
      color: "#666666"
   },
   "&.cm-editor": {
      border: "1px solid #aaaaaa;",
      height: "100%;",
      width: "100%;"
   },
   "&.cm-editor.cm-focused": {
      outline: "none",
      border: "1px dotted #001299;"
   },
   ".cm-matchingBracket, &.cm-editor.cm-focused .cm-matchingBracket": {
      backgroundColor: "#00be681e", // Optional highlight background
   },
   "@media only screen and (max-width: 320px)": {
      ".cm-gutters": {
         display: "none!important"
      }
   },

   ".cm-panel": {
         backgroundColor: "#faf7f4ff"
   }

});

export const xcodeWarmStyle: CreateThemeOptions["styles"] = [
   { tag: t.variableName, color: colour.warmthemetext },

   // Comment / GREEN / #
   { tag: t.comment, color: colour.darkgreen},

   // Escape char / YELLOW / 
   { tag: t.escape, color: colour.brown},

   // Directive / RED / words: alphabet: etc.
   { tag: t.meta, color: colour.royal, fontWeight: "bold" },

   // things...: etc.
   { tag: t.name, color: colour.royal },

   // LIGHT BLUE / commas, equals sign, colon
   { tag: t.link, color: colour.darkblue , fontWeight: "bold" }, 

   // CYAN / 0, ^
   { tag: t.operator, color: colour.royal}, 

   // PINK / #, +, *, (, {, [
   { tag: t.regexp, color: colour.darkpink },

   // ORANGE / Categories
   { tag: t.tagName, color: colour.darkred },

   // Weights
   { tag: t.strong, color: colour.darkcyan, fontStyle: "italic" },

   // distribution etc
   { tag: t.attributeName, color: colour.darkcyan },

   // + sign
   { tag: t.bitwiseOperator, color: colour.darkgreen, fontweight: "bold" },

   // - sign
   { tag: t.punctuation, color: colour.darkpink, fontweight: "bold" }
];

export function xcodeWarmInit(options?: Partial<CreateThemeOptions>) {
   const { theme = "light", settings = {}, styles = [] } = options || {};
   return createTheme({
      theme: theme,
      settings: {
         ...defaultSettingsXcodeWarm,
         ...settings,
      },
      styles: [...xcodeWarmStyle, ...styles],
   });
}

export const xcodeLight = [Lighty, xcodeLightInit()];

export const xcodeDark = [Darky, xcodeDarkInit()];

export const xcodeWarm = [Warmy, xcodeWarmInit()];