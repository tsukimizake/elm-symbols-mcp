import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { collectSymbols } from "./elmTsParser";

async function main() {
  const server = new McpServer({
    name: "ElmSymbolServer",
    version: "1.0.0",
  });

  server.resource(
    "elmSymbols", // リソース名
    new ResourceTemplate("file://{filePath}", { list: undefined }), // URIテンプレート
    async (uri, { filePath }) => {
      // filePath は ResourceTemplate から抽出された文字列型のパラメータ
      // 型アサーションやバリデーションを追加することも可能
      const path = filePath as string;

      try {
        const symbols = await collectSymbols(path);
        return {
          contents: [
            {
              uri: uri.href, // 要求されたURI
              text: JSON.stringify(symbols), // シンボル情報をJSON文字列として設定
            },
          ],
        };
      } catch (err) {
        console.error(
          `[MCP Server] Error processing resource ${uri.href}:`,
          err,
        );
        // エラーをスローすると、SDKが適切なJSON-RPCエラーレスポンスを生成します
        throw err;
      }
    },
  );

  const transport = new StdioServerTransport();
  console.error("📡 MCP Elm Symbol Server (stdio) starting...");
  await server.connect(transport);
  // server.connect は通常、サーバーが終了するまで解決されません
  console.error("📡 MCP Elm Symbol Server (stdio) connected and listening.");
}

main().catch((err) => {
  console.error("[MCP Server] Failed to start or unhandled error:", err);
  process.exit(1);
});
