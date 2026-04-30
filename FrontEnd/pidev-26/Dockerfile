FROM node:24-bullseye AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund
COPY . .

RUN npm run build -- --configuration production \
    && mkdir -p /app/out \
    && if [ -d "dist/pidev-26/browser" ]; then cp -a dist/pidev-26/browser/. /app/out/; \
    elif [ -d "dist/pidev-26" ]; then cp -a dist/pidev-26/. /app/out/; \
    else echo "ERROR: build output not found under dist/"; ls -la dist || true; exit 1; fi \
    && if [ ! -f /app/out/env.js ]; then printf '%s\n' "window.__env = window.__env || {};" > /app/out/env.js; fi

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]