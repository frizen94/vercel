#!/bin/bash
# Script de teste para validar sanitização XSS

echo "🧪 TESTE DE SANITIZAÇÃO XSS"
echo "============================"
echo ""

# Obter CSRF token
echo "1️⃣ Obtendo CSRF token..."
CSRF_TOKEN=$(curl -s http://localhost:5000/api/csrf-token -b /tmp/cookies.txt -c /tmp/cookies.txt | jq -r '.csrfToken')
echo "   ✅ Token obtido: ${CSRF_TOKEN:0:20}..."
echo ""

# Teste 1: Entrada com script malicioso
echo "2️⃣ TESTE 1: Enviando payload XSS malicioso"
echo "   Payload: <script>alert('XSS')</script>"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b /tmp/cookies.txt \
  -d '{
    "cardId": 999,
    "userId": 1,
    "content": "<script>alert(\"XSS\")</script>Hello World"
  }')

echo "   Resposta do servidor:"
echo "   $RESPONSE" | jq '.'
echo ""

# Teste 2: Entrada com tags HTML permitidas
echo "3️⃣ TESTE 2: Enviando HTML permitido (strong, em)"
RESPONSE2=$(curl -s -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b /tmp/cookies.txt \
  -d '{
    "cardId": 999,
    "userId": 1,
    "content": "<strong>Texto importante</strong> e <em>texto em itálico</em>"
  }')

echo "   Resposta do servidor:"
echo "   $RESPONSE2" | jq '.'
echo ""

# Teste 3: Entrada com evento onclick malicioso
echo "4️⃣ TESTE 3: Enviando evento onclick malicioso"
RESPONSE3=$(curl -s -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b /tmp/cookies.txt \
  -d '{
    "cardId": 999,
    "userId": 1,
    "content": "<a href=\"#\" onclick=\"alert(\\\"XSS\\\")\">Clique aqui</a>"
  }')

echo "   Resposta do servidor:"
echo "   $RESPONSE3" | jq '.'
echo ""

echo "✅ TESTES CONCLUÍDOS"
echo ""
echo "📊 ANÁLISE:"
echo "   - Scripts <script> devem ser REMOVIDOS ❌"
echo "   - Tags HTML permitidas (strong, em) devem ser PRESERVADAS ✅"
echo "   - Eventos (onclick) devem ser REMOVIDOS ❌"
echo "   - Apenas o conteúdo texto deve permanecer"
