#!/usr/bin/env sh
# Smoke tests de segurança - grava resultados em /app/teste.md
OUT=/app/teste.md
TMP_COOKIES=/tmp/test_cookies.txt
rm -f $OUT
rm -f $TMP_COOKIES
printf "# Teste de Segurança - %s\n\n" "$(date)" > $OUT

printf "## 1) Health check\n" >> $OUT
curl -sS -o /tmp/health.json -w "HTTP %{http_code}\n" http://localhost:5000/api/health >> $OUT || printf "curl failed\n" >> $OUT
printf "\n" >> $OUT

printf "## 2) CSRF token (GET /api/csrf-token)\n" >> $OUT
curl -sS -X GET -c $TMP_COOKIES -b $TMP_COOKIES http://localhost:5000/api/csrf-token -w "\nHTTP %{http_code}\n" >> $OUT || printf "curl failed\n" >> $OUT
printf "\n" >> $OUT

printf "## 3) POST /api/portfolios WITHOUT CSRF token (expect 403 or 401)\n" >> $OUT
curl -sS -X POST -H "Content-Type: application/json" -d '{"name":"test-from-script"}' -c $TMP_COOKIES -b $TMP_COOKIES http://localhost:5000/api/portfolios -w "\nHTTP %{http_code}\n" >> $OUT || printf "curl failed\n" >> $OUT
printf "\n" >> $OUT

printf "## 4) POST /api/portfolios WITH CSRF token (no auth)\n" >> $OUT
CSRF_JSON=/tmp/csrf.json
curl -sS -X GET -c $TMP_COOKIES -b $TMP_COOKIES http://localhost:5000/api/csrf-token -o $CSRF_JSON
TOKEN=$(grep -o '\"csrfToken\"[[:space:]]*:[[:space:]]*\"[^\"]*\"' $CSRF_JSON | head -n1 | sed 's/.*: *"\(.*\)"/\1/')
if [ -z "$TOKEN" ]; then
  printf "Token not found\n" >> $OUT
else
  printf "Token: %s\n" "$TOKEN" >> $OUT
  curl -sS -X POST -H "Content-Type: application/json" -H "X-CSRF-Token: $TOKEN" -d '{"name":"test-from-script"}' -c $TMP_COOKIES -b $TMP_COOKIES http://localhost:5000/api/portfolios -w "\nHTTP %{http_code}\n" >> $OUT || printf "curl failed\n" >> $OUT
fi
printf "\n" >> $OUT

printf "## 5) SQL injection attempt on /api/login (expect rejected)\n" >> $OUT
SQL_PAYLOAD=/tmp/sqlpayload.json
printf '%s' "{\"username\":\"admin'; DROP TABLE users; --\",\"password\":\"irrelevant\"}" > $SQL_PAYLOAD
curl -sS -X POST -H "Content-Type: application/json" -d @$SQL_PAYLOAD http://localhost:5000/api/login -w "\nHTTP %{http_code}\n" >> $OUT || printf "curl failed\n" >> $OUT
printf "\n" >> $OUT

printf "## 6) Logout (POST /api/logout)\n" >> $OUT
curl -sS -X POST http://localhost:5000/api/logout -w "\nHTTP %{http_code}\n" >> $OUT || printf "curl failed\n" >> $OUT
printf "\n" >> $OUT

printf "Fim dos testes.\n" >> $OUT

chown $(id -u):$(id -g) $OUT 2>/dev/null || true
exit 0
