import { readFileSync } from 'fs';
import { Elm } from './Main.elm';

const app = Elm.Main.init();


export interface SymbolInfo {
  name: string;
  signature: string;
  doc: string;
}


export const collectSymbols = async (path: string) => {
  const file = readFileSync(path, 'utf-8');
  const answer = await sendAndWaitOnce(file);
  console.log(answer);
}

// 注意: 複数のメッセージをasyncに処理できない
async function sendAndWaitOnce(value: string) {
  return new Promise(resolve => {
    const handler = (msg: unknown) => {
      app.ports.toJs.unsubscribe(handler);
      resolve(msg);
    };
    app.ports.toJs.subscribe(handler);
    app.ports.fromJs.send(value);
  });
}
