import readline from 'readline';
import { collectSymbols } from './elmTsParser';

/**
 * stdio ベースの MCP サーバ
 *
 * - 1 行の入力を検索クエリとして処理し、結果を 1 行の JSON で返す
 * - 空行は無視、"exit" で終了
 *
 * 起動例:
 *   npx ts-node --transpile-only server/stdioServer.ts
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

console.error('📡 MCP stdio server started. type a query or "exit".');

rl.on('line', async (raw) => {
  const line = raw.trim();
  if (line.length === 0) return;

  if (line === 'exit') {
    console.error('👋 bye');
    process.exit(0);
  }

  const q = line.toLowerCase();

  try {
    const all = await collectSymbols();
    const result =
      q.length > 0
        ? all.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.module.toLowerCase().includes(q),
          )
        : all;

    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (err) {
    console.error('[error]', err);
    process.stdout.write('[]\n');
  }
});
