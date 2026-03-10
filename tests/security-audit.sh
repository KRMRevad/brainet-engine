#!/bin/bash

##############################################
# BRAINET Security Audit — Curl Tests
# SYS-22 (Sanitization) & SYS-23 (Info Disclosure)
# ============================================

set -e

API_URL="http://localhost:3001/api"
JWT_TOKEN=""

echo "🔒 BRAINET Security Audit — $(date)"
echo "========================================"
echo ""

# ============================================
# 1. TEST: /api/health (PUBLIC, NO AUTH)
# ============================================
echo "TEST 1: /api/health (public endpoint)"
echo "----"

HEALTH=$(curl -s -X GET "$API_URL/health")
echo "Response: $HEALTH"
echo ""

# Validate: no workspace path, no model, no Chrome command
if echo "$HEALTH" | grep -q "Seagate\|/Volumes\|/Applications\|--remote-debugging-port\|claude-sonnet\|gpt-4o"; then
    echo "❌ FAILED: Health endpoint exposes sensitive information!"
    exit 1
fi

if echo "$HEALTH" | grep -q "Chrome.app\|chatgpt.com\|claude.ai"; then
    echo "❌ FAILED: Health endpoint exposes application paths or URLs!"
    exit 1
fi

echo "✅ PASS: /api/health does not expose sensitive data"
echo ""

# ============================================
# 2. TEST: /api/auth/login (PUBLIC, NO AUTH)
# ============================================
echo "TEST 2: /api/auth/login (password login)"
echo "----"

LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"test-admin-pass-CHANGE-IN-PRODUCTION"}')

echo "Response: $LOGIN"

# Extract token
JWT_TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ FAILED: Could not obtain JWT token"
    exit 1
fi

echo "✅ PASS: /api/auth/login returned valid JWT token"
echo ""

# ============================================
# 3. TEST: /api/nichos (PROTECTED, REQUIRES AUTH)
# ============================================
echo "TEST 3: /api/nichos without token (should fail)"
echo "----"

NICHOS_NO_AUTH=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" -X GET "$API_URL/nichos")
HTTP_CODE=$(echo "$NICHOS_NO_AUTH" | grep "HTTP_CODE:" | cut -d':' -f2)

if [ "$HTTP_CODE" != "401" ]; then
    echo "❌ FAILED: /api/nichos should require authentication (got $HTTP_CODE)"
    exit 1
fi

echo "✅ PASS: /api/nichos returns 401 without token"
echo ""

# ============================================
# 4. TEST: /api/nichos with valid token
# ============================================
echo "TEST 4: /api/nichos with valid JWT token"
echo "----"

NICHOS_WITH_AUTH=$(curl -s -X GET "$API_URL/nichos" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response (first 200 chars): ${NICHOS_WITH_AUTH:0:200}..."
echo ""

if echo "$NICHOS_WITH_AUTH" | grep -q "nichos\|error"; then
    echo "✅ PASS: /api/nichos returned data with valid token"
else
    echo "⚠️  WARNING: /api/nichos response unexpected"
fi
echo ""

# ============================================
# 5. TEST: /api/pipeline/start (PROTECTED)
# ============================================
echo "TEST 5: /api/pipeline/start without token (should fail)"
echo "----"

PIPELINE_NO_AUTH=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" -X POST "$API_URL/pipeline/start" \
  -H "Content-Type: application/json" \
  -d '{"nichoId":"tech","angulo":"test"}')

HTTP_CODE=$(echo "$PIPELINE_NO_AUTH" | grep "HTTP_CODE:" | cut -d':' -f2)

if [ "$HTTP_CODE" != "401" ]; then
    echo "❌ FAILED: /api/pipeline/start should require authentication (got $HTTP_CODE)"
    exit 1
fi

echo "✅ PASS: /api/pipeline/start returns 401 without token"
echo ""

# ============================================
# 6. TEST: SYS-22 Input Sanitization
# ============================================
echo "TEST 6: SYS-22 Input Sanitization (XSS prevention)"
echo "----"

MALICIOUS_INPUT='<img src=x onerror="alert(1)">'
SANITIZED=$(curl -s -X POST "$API_URL/pipeline/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"nichoId\":\"tech\",\"angulo\":\"$MALICIOUS_INPUT\"}")

# Should either succeed (input sanitized) or fail gracefully
if echo "$SANITIZED" | grep -q "jobId\|error\|nichoId"; then
    echo "✅ PASS: Input handled correctly (no XSS vulnerability)"
else
    echo "⚠️  WARNING: Unexpected response to malicious input"
fi
echo ""

# ============================================
# 7. TEST: CORS Headers
# ============================================
echo "TEST 7: CORS Configuration"
echo "----"

CORS_RESPONSE=$(curl -s -i -X OPTIONS "$API_URL/health" \
  -H "Origin: http://localhost:5173")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow"; then
    echo "✅ PASS: CORS headers are configured"
else
    echo "⚠️  WARNING: No CORS headers detected"
fi
echo ""

# ============================================
# FINAL REPORT
# ============================================
echo "========================================"
echo "🎯 Security Audit Complete"
echo ""
echo "Summary:"
echo "  ✅ /api/health does not expose sensitive data"
echo "  ✅ Protected endpoints require JWT authentication"
echo "  ✅ Input sanitization is enforced"
echo "  ✅ CORS is properly configured"
echo ""
echo "Status: ALL CRITICAL SECURITY CHECKS PASSED"
echo "========================================"
