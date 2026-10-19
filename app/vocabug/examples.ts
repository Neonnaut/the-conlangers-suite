const examples: { [key: string]: string } = {
  default: 
`; Vocabug randomly generates vocabulary from a given definition of graphemes
; and word patterns. It can be used to generate words for a fictional language,
; original nicknames or passwords, or just for fun.

; Anything after a semicolon is a comment until the end of the line.

; A Category is a group of graphemes assigned to a key.
; By default, graphemes in a category furthest to the left
; are picked more often than graphemes to the right.
categories:
  C = t n k m r s p ch h w y
  L = ee oo aa ii uu
  V = a i e o u L
  F = n r s

; A Unit provides abbreviation of parts of a word-shape.
; Here we are using <$> to define the main syllable.
; Items enclosed in '(' and ')' only appear 10% of the time by default.
units:
  $ = CV(F)

; The first word-shape is picked the most often, the last, the least often.
words:
  (V)<$>, (V)<$><$>, (V)<$><$><$>, (V)<$><$><$><$>, V

; The 'graphemes' directive prevents transforms targeting
; only part of a grapheme. It also has additional uses.
graphemes:
  ee, oo, aa, ii, uu, ch

; Vocabug uses 'transforms' to change words, or outright reject them.
; Transforms are all placed inside the 'stage' directive.
stage:
  nn, nm, np, sh, ss -> ny, m, mp, s, s
  V: -> V / #_# ; Words that are a long vowel become short.
  yi -> 0 ; Remove words with <yi>

; Click the green 'Generate' button in the taskbar below to generate words!!
; Read the instructions linked above, or by clicking 'Help' in the taskbar below.`,
  advanced:
`categories:
  C = t k p n r b m s d h l w y g
  
  I = t k p n ^ m r b s d l h w y g
  J = t k p n m r b s d ^ l h w y g

  X = y r
  V = a i o e u
  W = u a o e
  T = &[Acute]
  F = n ' t

units:
  Onset = C(X|5%) ; Arbitrary onset with a chance of a follow-up <y> or <r>
  Coda = (F|9%) ; Optional coda
  $ = <Onset>V<Coda> ; Syllable with no stress
  X = <Onset>V[T|*2]<Coda>
  Y = <Onset>V[^|*93]<Coda> ; Penultimate syllable
  Z = <Onset>V[T|*5]<Coda>

  Onset-a = I(X|5%)
  Onset-b = J(X|5%)
  $-a = <Onset-a>V<Coda>
  $-b = <Onset-b>V<Coda>
  X-a = <Onset-a>V[T|*2]<Coda>
  Y-a = <Onset-a>V[^|*93]<Coda>

words:
  <X-a><Y><Z> <Y-a><X> <$-b> <$-a><X><Y><Z> 

stage:
  <routine = compose>
  i <recast-as> W / Cy_
  r -> ^ / C_ ! {p, b, t, d, k}_
  y -> ^ / {w, y}_

  C' -> C: ; This yields geminates
  
  < t  k  p  n  r  b  m  s  d  h  l  g  y  w
  n +  +  mp +  r  mb mm +  nd nn l  +  +  +
  t +  kt pt nt +  pt nt +  tt tt l  kt +  +  
  >

  e -> ^ / V{p,t,k,s,n,r,l}_#
  e -> a / _#

  ' -> ^

  CV -> ^ / _&T&T ; Haplology`,
  tonal:
`; A somewhat Yoruba-like tonal language
categories:
  I = k t ^ {p f} n r b m s l d c ç ş h y w g {kp gb}
  C = t k {f p} n r b m s d h l ŋ g c ş ç l y w {mb nd ŋg} {kp gb ŋgb}
  V = a i e o u
  W = a i ẹ ọ u
  T = ^*3.7 &[Acute]*3.3 &[Grave]*3 ; Gives mid-tone, high-tone, low-tone

units:
; + ATR harmony 
  A = IVT
  B = CVT
  C = CVT(n)

; - ATR harmony
  X = IWT
  Y = CWT
  Z = CWT(n)

words:
  <A><C> <A><B><C> <A><B><B><C>
  <X><Z> <X><Y><Z> <X><Y><Y><Z>
  <A>    <Z>

graphemes:
  {a e ẹ i o ọ u}<{á é ẹ́ í ó ọ́ ú}<{à è ẹ̀ ì ò ọ̀ ù} kp gb

stage:
; Combine vowels and diacritics into one character, if possible.
  <routine = compose>
; Palatalise <c> and <s> after <i> and its tonal variants.
  c s -> ç ş / _i~`,
  japanese: 
`; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and Phonological Unit Frequencies in Japanese... by Katsuo Tamaoka.

categories:
  I = k ^ t s n m h d g r z b w p
  C = k t s r n ^ h m d g z b w p
  V = a i u o e ; - The short vowels.
; <ʀ> yields long vowels.
  W = a i u o e {oʀ aʀ iʀ eʀ uʀ yu yo ya {yoʀ yuʀ yaʀ}}
; <ɴ> is the syllable final nasal.
; <ɢ> yields geminate consonants.
  F = ɴ ɢ

units:
  F = IW(F) ; First syllable of slightly different consonant distribution.
  $ = CW(F) ; Gives type C(y)V(ʀ)(ɴ,ɢ)
  L = CW(ɴ) ; Last syllable of type C(y)V(ʀ)(ɴ)

words:
  <F><$><L> <F><$><$><L> <F> <F><$><$><$><L> <F><L>

graphemes:
  ch sh ts

stage:
V=1(ʀ) -> ^ / 1ʀ_ ; No identical vowels after a long vowel.
V?[3,] -> V: ; Sequence of 3+ vowels becomes 2.

ɢ -> ɴ / _V

<  i   u   e   o   ya   yu   yo
s  shi +   +   +   sha  shu  sho
t  chi tsu +   +   cha  chu  cho
; "Yotsugana": <d> and <z> neutralise to <z> and <j> in some conditions.
z  ji  +   +   +   ja   ju   jo
d  ji  zu  +   +   ja   ju   jo
; In the history of Japanese, this was: f -> h ! _u
h  +   fu  +   +   +    +    +
; Non-historical way of getting onsetless <y> + V syllables
w  yu  yu  yo  yo  ya   yu   yo
>

; An apostrophe is inserted between a syllable final nasal, and a vowel or <y>.
ɴ -> n' / _W 

; <ɴ> assimilation, and <ɢ> gemination.
< ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
ɢ ɢtch ɢshsh ɢtts j  ɢkk g  ɢss z  ɢtt d  n  ɢpp b  ɢpp m  r  l  ɢpp ɢpp
ɴ nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw
>

ʀɢ ɴ ɢ -> ^ n ^ ; <ʀ> + <ɢ> is illegal. 

; Vowel sequences:
<  a   i   u   e  o
a  ai  +   oʀ  +  +
i  ya  ui  yuʀ +  yo
u  uʀ  +   ui  ai ai
e  eʀ  eʀ  yoʀ ai yo
o  oʀ  +   +   +  o
ʀ  ʀ   ʀ   ʀ   ʀ  ʀ
>
y -> i / sh_ / j_ / ch_

ʀ -> ^ / #*_# ; Collapse long vowel words into short vowel words.

Vʀ -> V: ; Get long vowels.

note:
  This gives very Japanese-like words, however:
  * The pitch accent is not represented here
  * /ɢn/ and /ɴV/ sequences are possibly overrepresented
  * Where light syllable is (C)V, and heavy is (C){VF,Vʀ(F)},
    in Japanese, the final two syllables of a word
    are least likely to be light followed by heavy`,
  australian: 
`note:
  This does not represent a single Australian language,
  nor does it represent the average Australian language,
  but it does create Australian looking words.

  CONSONANTS:
  p  t  th  j   k
  m  n  nh  ny  ng
     l  lh  y   w
     r  rh

  VOWELS:
  i ii    u uu
  a aa ai

  TRANSCRIPTION:
  - <th, nh, lh, rh> are retroflex consonants
  - <j> is a palatal voicless stop
  - <ny, ng> are palatal and velar nasals
  - Double vowels are long vowels

  PHONOTACTICS:
  - Words begin with <a> or a consonant that is not <r, rh, l, lh, nh>.
  - No monosyllabic words. Disylabic words DON'T begin with <a>
  - Medial Singleton consonants are unrestricted.
  - There are intervocalic consonant clusters.
  - Any vowel or <ai> occurs between any two consonants.
  - Vowel sequences other than <ai> don't occur
  - Words end in <a, i, u> or <n, l, r, rh, t>

categories:
; Initials:
  I = k p m w ng y n t j ny th
; Clusters
  X = {mp nt nht nj nyj ngk nk} {rp rj rk rm lk lp} {rm rny}
      {lhp lht lhk} {nm nny nng np}
; Medials
  C = k m rh l r w y n t j p ng lh th nh X nh
; Finals
  F = n l r rh t
; Vowels
  V = a i u {aa*1 ii {uu e ai}} 
  W = a i u

units:
  First = {IV*18, a}
  Di-first = IV
  Medial = CV
  Last = C{W*11,VF}

words:
  <First><Medial><Last>, <First><Medial><Medial><Last>,
  <First><Medial><Medial><Medial><Last>, <Di-first><Last>,
  <First><Medial><Medial><Medial><Medial><Last>

graphemes:
  aa uu ii ai th nh lh rh ny ng

stage:
; <ai> becomes <a> before palatals or <w>
  i -> ^ / a_{y,ny,j,w}

; Merge <e> into the other vowels
  e -> a / _#
  <@chance = 70%
    e → u / _(C)(C)u
  >
  <@chance = 70%
    e → i / _(C)(C)i
  >
  e -> a`
};

export { examples };