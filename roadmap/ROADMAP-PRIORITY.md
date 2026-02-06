## Flags
These are all a type of 'block'

```txt
<@right-to-left
```

Word is changed from left to right

```txt
<@replace-once
````

One change only per transform

```txt
<@no-overlap
```

The target of one change may not be used as the environment of the next

## If, then, else

Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

```txt
<@if
```

starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, at least one of the transforms are executed on that word.

```txt
><@then
```

is where you put transforms that will execute if there were transformations in `if` 

```txt
><@else
```
 is is where you put transforms that will execute if there were no transformations in `if`

```txt
>
```
 is the end of the block

For example:
```txt
<@if
  ; Deletion of schwa before r
  ə -> ^ / _r
><@then
  ; Then do metathesis of r and l
  rl -> %M
><@else
  ; Schwa becomes e if the first rule did not apply
  ə -> e
>
```

## Automatic Syllables 

There are two things at odds with each other: yielding and hierarchy

I need a hierarchy to choose the most prominant syllable

But then reluctance in round brackets makes that thing yield to the previous or next syllable

How to get CV.CCV

codas will yield to initials. this will not happen if a coda grapheme is not also an onset grapheme

For example:

```txt
categories:
  C = m, n, p, t, k
  V = a, i, u
  F = N, t

auto-syllables:
  Onset = (C)
  Nucleus = V
  Coda = (F)

paNapatta ==> paN.a.pat.ta
```
notice that we did not get "pa.Na.pat.ta"

## Feature bundle

```txt
features:
  PLACE = velar, labial

stage:
  [+nasal] -> [+nasal, 2] / _[+consonant 2=PLACE]
  banpadamka ==> bampadaŋka

```
So that we are moving the feature-nodes of the consonant before the nasal to the nasal.

## sub-stage

Sub-stage saves rules to be used later in a stage and can be used as many times as needed. The rules inside the `sub-stage` directive do not run until invoked using `<sub-stage = "the-name-of-the-substage">` in a stage directive:

```txt
sub-stage "resyllabify":
  i -> j / _[a,e,o,u]
  u -> w / _[a,e,i,o]

stage:
  <sub-stage = "resyllabify">
  ʔ -> ^
  
  <sub-stage = "resyllabify">
; iaruʔitua ==> jaruʔitwa ==> jaruitwa  ==> jarwitwa
```

In the above example we saved two rules as a macro under the name "resyllabify" and used that macro twice.

## Clean-up

A cleanup rule, applies after every subsequent rule. Its syntax would be like sub-stage.

I would then need a way to clear the clean-up rule at any time.

## Word classes

Like the so called "categories" in lexifer.ts

I would put a directive decorator that assigns each words directive a class

They're not that useful here as you can just comment out a line in the words: block

generated words would have meta information that they were in a pos or word class

Tranforms could then have a condition that targets that word with a word class

```
@words.class = nouns
words:
  Example

@words.class = verbs
words:
  Example2
```

## A way to do external sandhi.

For example:
```
  ^ -> n / a_#a 
; a elephant ==> an elephant
```

## Able to chain changes:

`a -> e -> i`

## Ignore

This would "skip" graphemes in the TARGET, CONDITION and EXCEPTION, like so:

```
<ignore = syllable-dividers
  tt -> d
>
  bat.ta ==> ba.da
; 'tt' becomes 'd'. Ignore any '.' between 't's
```
