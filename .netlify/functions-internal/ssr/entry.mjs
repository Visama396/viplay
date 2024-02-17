import { renderers } from './renderers.mjs';
import { manifest } from './manifest_rqL5gLmD.mjs';
import * as serverEntrypointModule from '@astrojs/netlify/ssr-function.js';
import { onRequest } from './_noop-middleware.mjs';

const _page0 = () => import('./chunks/generic_D-ymVFTW.mjs');
const _page1 = () => import('./chunks/get-info-playlist_yuLW7drs.mjs');
const _page2 = () => import('./chunks/_id__BVNJccTL.mjs');
const _page3 = () => import('./chunks/index_VbJkdfIi.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/get-info-playlist.json.js", _page1],
    ["src/pages/playlist/[id].astro", _page2],
    ["src/pages/index.astro", _page3]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    renderers,
    middleware: onRequest
});
const _args = {
    "middlewareSecret": "9f4520db-d4b5-47a8-b041-9f286cf8efef"
};
const _exports = serverEntrypointModule.createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
