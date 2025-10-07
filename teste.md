# Teste de Segurança - Tue Oct  7 18:50:51 UTC 2025

## 1) Health check
HTTP 200

## 2) CSRF token (GET /api/csrf-token)
{"error":"Falha ao gerar token CSRF","message":"Token CSRF temporariamente indisponível","details":"misconfigured csrf"}
HTTP 500

## 3) POST /api/portfolios WITHOUT CSRF token (expect 403 or 401)
{"error":"invalid csrf token","stack":"ForbiddenError: invalid csrf token\n    at csrf (/app/node_modules/csurf/index.js:112:19)\n    at <anonymous> (/app/server/routes.ts:232:5)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at strategy.pass (/app/node_modules/passport/lib/middleware/authenticate.js:355:9)\n    at SessionStrategy.authenticate (/app/node_modules/passport/lib/strategies/session.js:126:10)\n    at attempt (/app/node_modules/passport/lib/middleware/authenticate.js:378:16)\n    at authenticate (/app/node_modules/passport/lib/middleware/authenticate.js:379:7)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at initialize (/app/node_modules/passport/lib/middleware/initialize.js:98:5)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at session (/app/node_modules/express-session/index.js:487:7)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at <anonymous> (/app/server/index.ts:76:3)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at urlencodedParser (/app/node_modules/body-parser/lib/types/urlencoded.js:85:7)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)\n    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)\n    at /app/node_modules/express/lib/router/index.js:286:9\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)\n    at next (/app/node_modules/express/lib/router/index.js:280:10)\n    at /app/node_modules/body-parser/lib/read.js:137:5\n    at AsyncResource.runInAsyncScope (node:async_hooks:206:9)\n    at invokeCallback (/app/node_modules/raw-body/index.js:238:16)\n    at done (/app/node_modules/raw-body/index.js:227:7)\n    at IncomingMessage.onEnd (/app/node_modules/raw-body/index.js:287:7)\n    at IncomingMessage.emit (node:events:524:28)\n    at endReadableNT (node:internal/streams/readable:1698:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)"}
HTTP 403

## 4) POST /api/portfolios WITH CSRF token (no auth)
Token not found

## 5) SQL injection attempt on /api/login (expect rejected)
{"message":"Credenciais inválidas"}
HTTP 401

## 6) Logout (POST /api/logout)
{"message":"Logout bem-sucedido"}
HTTP 200

Fim dos testes.
