import { readFileSync } from 'fs';
import Elm from './Main.elm';

const app = Elm.init()

app.ports.toJs.subscribe((text: string) => {
  console.log('[Elm]', text)
})

function sendToElm(input: string) {
  app.ports.fromJs.send(input)
}

export interface SymbolInfo {
  name: string;
  signature: string;
  doc: string;
}


export const collectSymbols = async (path: string) => {
  const file = readFileSync(path, 'utf-8');
  sendToElm(file);
}
