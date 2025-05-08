import Parser from 'tree-sitter';
import Elm from 'tree-sitter-elm';
import fg from 'fast-glob';
import { readFile, stat } from 'fs/promises';

/**
 * 返却するシンボル情報型
 */
export interface SymbolInfo {
  module: string;
  name: string;
  signature: string;
  doc: string;
}

/** 対象 Elm ファイルの glob */
const SRC_GLOB = 'src/**/*.elm';

const parser = new Parser();
parser.setLanguage(Elm);

// mtime ベースのシンプルキャッシュ
let cache: { mtime: number; data: SymbolInfo[] } = { mtime: 0, data: [] };

/**
 * Tree-sitter を使って公開シンボルを収集
 */
export async function collectSymbols(): Promise<SymbolInfo[]> {
  const files = await fg(SRC_GLOB);
  const mtimes = await Promise.all(
    files.map((f) => stat(f).then((s) => s.mtimeMs)),
  );
  const newest = Math.max(0, ...mtimes);

  if (newest <= cache.mtime) {
    return cache.data;
  }

  const symbols: SymbolInfo[] = [];

  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const tree = parser.parse(code);

    /* ---------- モジュール宣言 ---------- */
    const moduleDecl = tree.rootNode.descendantsOfType('module_declaration')[0];
    if (!moduleDecl) continue;

    const moduleName =
      moduleDecl.childForFieldName('name')?.text.replace(/\s/g, '') ?? 'Unknown';

    /* ---------- exposing ---------- */
    const exposingNode = moduleDecl.childForFieldName('exposing');
    let exposeAll = false;
    const exposed = new Set<string>();

    if (exposingNode) {
      exposeAll = exposingNode.text.trim() === '(..)';
      if (!exposeAll) {
        exposingNode
          .descendantsOfType(['upper_case_qid', 'lower_case_qid'])
          .forEach((n) => exposed.add(n.text.split('.').pop()!));
      }
    }

    /* ---------- 関数宣言 ---------- */
    tree.rootNode.descendantsOfType('value_declaration').forEach((node) => {
      const nameNode = node.childForFieldName('name');
      const fnName = nameNode?.text;
      if (!fnName) return;
      if (!exposeAll && !exposed.has(fnName)) return;

      // 型注釈（次の sibling で type_annotation を探す）
      let signature = '';
      let sib = node.nextSibling;
      while (sib) {
        if (sib.type === 'type_annotation') {
          signature = sib.text.trim();
          break;
        }
        if (!['comment', 'blank_line'].includes(sib.type)) break;
        sib = sib.nextSibling;
      }

      // ドキュメントコメント（直前の block_comment で {-| ... -}）
      let doc = '';
      let prev = node.previousSibling;
      while (prev && prev.type === 'block_comment') {
        if (/^\{\-\|/.test(prev.text)) {
          doc = prev.text
            .replace(/^\{\-\|?/, '')
            .replace(/\-\}$/, '')
            .trim();
          break;
        }
        prev = prev.previousSibling;
      }

      symbols.push({ module: moduleName, name: fnName, signature, doc });
    });
  }

  cache = { mtime: newest, data: symbols };
  return symbols;
}
