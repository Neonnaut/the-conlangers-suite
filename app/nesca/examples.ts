const examples: { [key: string]: {file:string, input_words:string} } = {
default: {
file:
`graphemes:
  b, d, g, m, n, l, j, p, t, k, ʔ, s, a, i, e, o, u, ə

feature-field:
          p b t d k g ʔ s m n l j
voiced    - + - + - + - - + + + +
plosive   + + + + + + + - - - - -

features:
  +voiced = b, d, g, m, n, l, j
  -voiced = p, t, k, s, 
  +plosive = p, b, t, d, k, g, ʔ
  -plosive = m, n, l, j, s
  +vowel = a i e o u ə ɨ
  +non-yod = +vowel ^i ; all vowels except <i>

stage:
; Do a vowel chain shift.
  ə o u -> o u ɨ

; Delete word initial glottal stop.
  ʔ -> ^ / #_

; Palatalize <k> and <s> before <i>.
  k, s -> tʃ, ʃ / _i
  i -> ^ / {tʃ, j, ʃ}_[+non-yod]

; <i> + vowel that isn't <i> becomes <j> + vowel.
  i -> j / _[+non-yod]

; Delete word final <e> when followed by a vowel and optional grapheme
; except when a consonant before it is a voiced plosive.
  e -> ^ / _# / [+vowel](*)_ ! [+voiced, +plosive]_`,
 input_words: `bade\nbate\nkito\nsiəmuso\nnesca\nʔa`
},
latin_to_portuguese: {
file:
`; Latin to Portuguese sound changes
; adapted from https://www.zompist.com/sca2.html

categories:
  V = a e i o u
  L = ā ē ī ō ū
  C = p t c q b d g m n l r j h f v s

stage:
  s, m -> ^ / _#
  i -> j / _V
  L -> V
  e -> ^ / Vr_#
  v -> ^ / V_V
  u -> o /_#
  gn -> nh
  p, t, c -> b, d, g / V_V
  c -> i / {i, e}_t
  c -> u / {o u}_t
  p -> ^ / V_t
  ii -> i
  e -> ^ / C_rV`,
  input_words: `lector\ndoctor\nfocus\njocus\ndistrictus\ncīvitatem\nadoptare\nopera\nsecundus\nfīliam\npōntem`
}
};

export { examples };