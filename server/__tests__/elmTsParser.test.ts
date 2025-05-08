import { collectSymbols, SymbolInfo } from '../elmTsParser';
import { describe, it, expect } from '@jest/globals';

describe('elmTsParser', () => {
  describe('collectSymbols', () => {
    it('should parse server/__tests__/Extra.elm correctly', async () => {
      const targetFile = 'server/__tests__/Extra.elm';
      const symbols = await collectSymbols(targetFile);

      const expectedSymbols: SymbolInfo[] = [
        {

          name: 'flip',
          signature: 'flip : (a -> b -> c) -> (b -> a -> c)',
          doc: 'Flip the order of the first two arguments to a function.',
        },
        {

          name: 'putIn',
          signature: 'putIn : (a -> r -> r) -> r -> a -> r',
          doc: `Alias to flip.
setemが生成したsetterを使って逆向きにsetしたいときに使う

    shared
        |> s_adminUser (Just adminUser)
        |> putIn s_shared m`,
        },
        {
          name: 'compareBy',
          signature: 'compareBy : (a -> comparable) -> a -> a -> Order',
          doc: '',
        },
        {
          name: 'compareByHelp',
          signature: 'compareByHelp : (b -> b -> Order) -> (a -> b) -> a -> a -> Order',
          doc: '',
        },
        {
          name: 'flipCompare',
          signature: 'flipCompare : (a -> a -> Order) -> a -> a -> Order',
          doc: '',
        },
        {
          name: 'withEqCompare',
          signature: 'withEqCompare : (a -> a -> Order) -> (a -> a -> Order) -> a -> a -> Order',
          doc: '',
        },
        {
          name: 'compareBool',
          signature: 'compareBool : Bool -> Bool -> Order',
          doc: '',
        },
        {
          name: 'updateIn',
          signature: 'updateIn : (a -> b) -> (b -> a -> a) -> (b -> b) -> a -> a',
          doc: '',
        },
        {
          name: 'updateMaybeIn',
          signature: 'updateMaybeIn : (a -> Maybe b) -> (b -> a -> a) -> (b -> b) -> a -> a',
          doc: '',
        },
      ];

      expect(symbols).toEqual(expectedSymbols);
    });
  });
});
