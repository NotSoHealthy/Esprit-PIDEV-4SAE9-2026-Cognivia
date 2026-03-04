#!/bin/bash
# Enable internationalization in pidev realm
# Step 1: Get admin token
TOKEN=$(curl -sS -X POST 'http://localhost:8180/realms/master/protocol/openid-connect/token' \
  -d 'grant_type=password&client_id=admin-cli&username=admin&password=admin' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

echo "Got token: ${TOKEN:0:20}..."

# Step 2: Enable i18n on pidev realm
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT \
  "http://localhost:8180/admin/realms/pidev" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"internationalizationEnabled":true,"supportedLocales":["en","fr","ar"],"defaultLocale":"en"}')

echo "Enable i18n HTTP code: $HTTP_CODE"

# Step 3: Sync theme files
cp -rv /mnt/c/Users/souha/OneDrive/Bureau/PIDEV-26/BackEnd/docker/keycloak/themes /home/sora/PIDEV-26/BackEnd/docker/keycloak/

# Step 4: Restart keycloak
docker restart keycloak-keycloak-1

echo "DONE"
