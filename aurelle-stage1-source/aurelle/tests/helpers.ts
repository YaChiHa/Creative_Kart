import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

export type FileOverride = (urlPath: string, body: Buffer) => Buffer;

export interface StaticServer {
  /** Origin with a trailing slash, for example "http://127.0.0.1:41234/". */
  readonly url: string;
  /** Changes what the server returns from now on, to simulate shipping a new version. */
  setOverride(override: FileOverride | null): void;
  /** Shuts the server down completely, so the network is genuinely gone. Safe to call twice. */
  stop(): Promise<void>;
}

/**
 * Serves a built folder (such as dist/) from a throwaway local server.
 * Browser "offline mode" does not stop a service worker's own requests, so the
 * offline tests stop this server instead, which is a real connection failure.
 */
export async function startStaticServer(root: URL): Promise<StaticServer> {
  const rootPath = resolve(fileURLToPath(root));
  let override: FileOverride | null = null;
  let stopped = false;

  const server = createServer((request, response) => {
    void (async () => {
      const urlPath = new URL(request.url ?? "/", "http://localhost").pathname;
      const relativePath = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath.slice(1));
      const filePath = resolve(rootPath, relativePath);
      if (filePath !== rootPath && !filePath.startsWith(rootPath + sep)) {
        response.writeHead(403).end();
        return;
      }
      try {
        const original = await readFile(filePath);
        const body = override ? override(urlPath, original) : original;
        response.writeHead(200, {
          "content-type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
          "cache-control": "no-cache",
        });
        response.end(body);
      } catch {
        response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
      }
    })();
  });

  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/`,
    setOverride(next) {
      override = next;
    },
    async stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      server.closeAllConnections();
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}

export interface PageProblems {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: string[];
}

/** Starts collecting anything that would count as a problem on the page. Call before goto(). */
export function watchForProblems(page: Page): PageProblems {
  const problems: PageProblems = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => problems.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    problems.failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? "failed"})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      problems.badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return problems;
}
