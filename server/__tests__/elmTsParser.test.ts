import { collectSymbols, SymbolInfo } from '../elmTsParser';
import { describe, it, expect } from '@jest/globals';

describe('elmTsParser', () => {
  describe('collectSymbols', () => {
    it('should parse server/__tests__/Extra.elm correctly', async () => {
      const targetFile = 'server/__tests__/Extra.elm';
      const symbols = await collectSymbols(targetFile);

      const expectedSymbols: SymbolInfo[] = [
        {
          module: 'Basics.Extra',
          name: 'flip',
          signature: '',
          doc: 'Flip the order of the first two arguments to a function.',
        },
        {
          module: 'Basics.Extra',
          name: 'putIn',
          signature: '',
          doc: `Alias to flip.
setemが生成したsetterを使って逆向きにsetしたいときに使う

    shared
        |> s_adminUser (Just adminUser)
        |> putIn s_shared m`,
        },
        {
          module: 'Basics.Extra',
          name: 'compareBy',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'compareByHelp',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'flipCompare',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'withEqCompare',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'compareBool',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'updateIn',
          signature: '',
          doc: '',
        },
        {
          module: 'Basics.Extra',
          name: 'updateMaybeIn',
          signature: '',
          doc: '',
        },
      ];

      expect(symbols).toEqual(expectedSymbols);
    });
  });
});
