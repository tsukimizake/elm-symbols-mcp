import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { collectSymbols } from "./elmTsParser";

const server = new McpServer({
  name: "elm-symbol-server",
  version: "1.0.0",
}, { instructions: "This server return infos of the symbols exposed from the given Elm file." });

server.tool(
  "elm-symbols",
  { filePath: z.string() },
  async ({ filePath }) => {
    try {
      const symbols = await collectSymbols(filePath);
      return {
        content:
          [{
            type: "text",
            text: JSON.stringify(symbols),
          }]
      };
    }
    catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${error}`
          }
        ]
      };
    }
  }
);


// for debug
await collectSymbols("server/Main.elm");

const transport = new StdioServerTransport();
await server.connect(transport);
