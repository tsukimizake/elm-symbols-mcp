import Parser from "tree-sitter";
import Elm from "@elm-tooling/tree-sitter-elm";
import { readFile } from "node:fs/promises";

/**
 * 返却するシンボル情報型
 */
export interface SymbolInfo {
  name: string;
  signature: string;
  doc: string;
}

/**
 * Tree-sitter を使って公開シンボルを収集
 */
export async function collectSymbols(
  targetFile: string,
): Promise<SymbolInfo[]> {
  const symbols: SymbolInfo[] = [];

  const code = await readFile(targetFile, "utf8");
  const parser = new Parser();
  parser.setLanguage(Elm);
  const tree = parser.parse(code);


  /* ---------- exposing ---------- */

  const moduleDecl = tree.rootNode.descendantsOfType("module_declaration")[0];
  if (!moduleDecl) {
    return symbols;
  }
  const exposingNode = moduleDecl.children.find(
    (c) => c.type === "exposing_list",
  );
  let exposeAll = false;
  const exposed = new Set<string>();

  if (exposingNode) {
    exposeAll = exposingNode.text.trim() === "(..)";
    if (!exposeAll) {
      exposingNode
        .descendantsOfType("exposed_value")
        .forEach((node) => {
          const child = node.firstChild;
          if (child) {
            exposed.add(child.text);
          }
        })
    }
  }

  /* ---------- 関数宣言 ---------- */
  tree.rootNode.descendantsOfType("value_declaration").forEach((node) => {
    const functionDeclarationLeft = node.children.find(
      (c) => c.type === "function_declaration_left",
    );
    const nameNode = functionDeclarationLeft?.children.find(
      (id) => id.type === "lower_case_identifier",
    );
    const fnName = nameNode?.text;
    if (!fnName) return;
    if (!exposeAll && !exposed.has(fnName)) return;

    // 型注釈（直前のsiblingでtype_annotation を探す）
    let signature = "";
    let sib = node.previousSibling;
    while (sib) {
      if (sib.type === "type_annotation") {
        signature = sib.text.trim();
        break;
      }
      if (!["comment", "blank_line"].includes(sib.type)) break;
      sib = sib.nextSibling;
    }

    // ドキュメントコメント（直前の block_comment で {-| ... -}）
    let doc = "";
    let prev = node.previousSibling?.previousSibling;
    while (prev && prev.type === "block_comment") {
      if (/^\{\-\|/.test(prev.text)) {
        doc = prev.text
          .replace(/^\{\-\|?/, "")
          .replace(/\-\}$/, "")
          .trim();
        break;
      }
      prev = prev.previousSibling;
    }

    symbols.push({ name: fnName, signature, doc });
  });

  return symbols;
}
