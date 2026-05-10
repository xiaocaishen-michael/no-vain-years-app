/**
 * CF Pages Functions catch-all reverse proxy for `/api/*`.
 *
 * Web bundle fetches `https://app.xiaocaishen.me/api/v1/...` (same-origin).
 * This function transparently forwards to `https://api.xiaocaishen.me/api/...`
 * on the Aliyun ECS backend.
 *
 * Why same-origin: 国内浏览器（华为 / UC / 360 / 夸克）按"未备案 + 海外源 +
 * 短域 + api. 子域"启发式拦截 cross-origin 请求，即便关闭"广告过滤"也仍会
 * 拦（实证 2026-05-10 华为浏览器即使 ad-block 关闭仍 block）。同源 fetch
 * 让浏览器看不到 api.xiaocaishen.me 子域，规避所有按子域名的拦截。
 *
 * 副作用：CORS preflight 不再触发；server ProdCorsConfig 仍保留作为
 * native (mobile M2+) 直连 + 直接 curl 验证用兜底。
 *
 * 限额：CF Pages Functions 免费 100k req/天 + 10ms CPU/inv（fetch 透传 IO
 * 主体，CPU 几乎为 0）— M1 单人远不到上限。
 *
 * 不解决：CF 海外边缘到阿里云国内的 latency，M3 备案 + 国内 CDN 才彻底解。
 *
 * 类型注解略：本仓 pnpm-workspace 不含 functions/，PagesFunction 类型来自
 * @cloudflare/workers-types 但不必为单文件加 devDep；CF 运行时按 Workers
 * runtime 编译，不要求显式类型。
 */
export const onRequest = async ({ request, params }) => {
  const url = new URL(request.url);
  const target = `https://api.xiaocaishen.me/api/${params.path}${url.search}`;
  return fetch(new Request(target, request));
};
