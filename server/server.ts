import express from 'express';
import { collectSymbols } from './elmTsParser';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3333;
const app = express();

/**
 * GET /api/symbols
 *  ?q=xxx で部分一致フィルタ
 */
app.get('/api/symbols', async (req, res) => {
  try {
    const all = await collectSymbols();
    const q = String(req.query.q ?? '').toLowerCase();
    const result =
      q.length > 0
        ? all.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.module.toLowerCase().includes(q),
          )
        : all;
    res.json(result);
  } catch (err) {
    /* eslint-disable no-console */
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`📡 MCP server listening on http://localhost:${PORT}`);
});
