/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  // Minimal runtime caching - only same-origin requests to avoid Firefox CORS with WASM
  runtimeCaching: [
    // Cache same-origin documents (HTML pages) with network-first strategy
    {
      matcher: ({ request, sameOrigin }) => {
        return sameOrigin && request.destination === "document";
      },
      handler: new NetworkFirst({
        cacheName: "pages-cache",
      }),
    },
    // Cache same-origin static assets (JS, CSS, fonts) with cache-first strategy
    {
      matcher: ({ request, sameOrigin }) => {
        return (
          sameOrigin &&
          (request.destination === "script" ||
            request.destination === "style" ||
            request.destination === "font")
        );
      },
      handler: new CacheFirst({
        cacheName: "assets-cache",
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
