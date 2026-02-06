## Positioner

This feature exists in Geoff's Sound Changer. I do not think it is necessary, and I am already running out of special characters.

Positioners, enclosed in `-[` and `]`, allows a grapheme to the left of it to be captured only when it is the Nth in the word:

```
; Change the second <o> in a word to <x> after the second <s>
  o-[2] -> x / s-[2]_
; sososo ==> sosxso
```
If we want to match the last occurence of a grapheme in a word, use `-1`. For the second last occurence of a grapheme in a word, use `-2`, and so forth:
```
; Change the last <o> in a word to <x>
  o-[-1] -> x
; sososo ==> sososx
```

## Meta tag decorators

`@meta.name = languageX`
`@meta.author = name`

What would the purpose be. To print out the name and author in a preamble?

## Promises

This represents an almost idealist view on word generation.

For example. In Japanese. You can generalise the syllable type as (C(y))V(F). But the forms you would get would be incorrect as the only vowels allowed after <y> is {u, o, a}.

Instead you could ensure that the only vowels allowed in the V pool are {u, o, a} WHEN <y> is before it.

This would ensure that if a the optional `y` appears, The only graphemes that would be in the pool for `V` would be `a,o,a`, avoiding a `yi` syllable inside word creation.

`words: C(j->{u,o,a})V`

So the base of the arrow would be the hook, and the end of the arrow would be the promise that removes all items from the next group except for what is in the promise.

This would also work backwards:

For example in spanish, the only consonant + <r> clusters allowed are plosive + <r>

`words: C({p,b,t,d,k,g}<-r)V`

## Reverse changes

Can tell a stage to reverse itself. So you could use words from a modern language and get words of a proto-language. This has been done in https://000024.org/rsca.html

`@stage.reverse-sound-change`

This would probably require special syntax such as 'undelete'

## Escapes

Right now, escape chars could interfere with PUA

## Rewrite program in Rust, Haskell, Python, Kotlin, Typescript

Leaning towards Kotlin. Need to figure out "DSL" or "tree-sitter"

https://eloquentjavascript.net/1st_edition/chapter6.html

https://docs.python.org/3/howto/functional.html#generators

## Lezer grammar

Currently, the web interface uses Codemirror StreamLanguage, instead of the significantly harder to code, "Lezer" grammar syntax. A Lezer highlighter would still be nice.

## Autocomplete suggestions

So .... after I type "routine =" or "directive.distribution =", it would show context menu of options 

## Add typo check on comments

Red squiggly underline on comments that are typos. Need to process with typo.js after editor