//import vocabug from '../dist/vocabug.es.js';

import the_conlangers_suite from '../src/index'
import { examples } from '../app/nesca/examples'


import { describe, it, expect } from 'vitest';

describe('nesca', () => {
  it('returns changed words', () => {

    for (const [name, example] of Object.entries(examples)) {

      const run = the_conlangers_suite.nesca({

        file: example.file,
        input_words: example.input_words,
        
      });
      expect(typeof run.payload).toBe('string');
      expect(run.payload.length).toBeGreaterThan(0);
      expect(run.errors.length).toBeLessThan(1);
      expect(run.warnings.length).toBeLessThan(1);
      expect(run.infos.length).toBeGreaterThan(0);
      //expect(run.diagnostics.length).toBeGreaterThan(0);
      console.log(`Example: ${name}; words: ${run.payload}`);
    }
  });
});