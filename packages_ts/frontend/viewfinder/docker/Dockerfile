# Build stage
FROM node:latest as build
LABEL maintainer="Marc <xtof@relica.io>"

# Add cache busting argument
ARG CACHE_BUST=default

WORKDIR /usr/src/app

# Copy root package files first
COPY package.json .
COPY yarn.lock .

# Copy package.json files for all workspace packages (needed for yarn workspaces)
COPY packages_ts/libs/types/package.json ./packages_ts/libs/types/
COPY packages_ts/libs/constants/package.json ./packages_ts/libs/constants/
COPY packages_ts/frontend/components/fact-search-ui/package.json ./packages_ts/frontend/components/fact-search-ui/
COPY packages_ts/frontend/components/3d-graph-ui/package.json ./packages_ts/frontend/components/3d-graph-ui/
COPY packages_ts/core/hsm-manager/package.json ./packages_ts/core/hsm-manager/
COPY packages_ts/frontend/viewfinder/package.json ./packages_ts/frontend/viewfinder/
COPY packages_ts/shared/testing/package.json ./packages_ts/shared/testing/

# Remove shared-testing dev dependency from package.json files to avoid workspace resolution issues
RUN find packages_ts -name "package.json" -exec node -e "try { const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (pkg.devDependencies && pkg.devDependencies['@relica/shared-testing']) { delete pkg.devDependencies['@relica/shared-testing']; fs.writeFileSync(process.argv[1], JSON.stringify(pkg, null, 2)); } } catch(e) {}" {} \;

# Install dependencies
RUN yarn install --pure-lockfile --non-interactive --network-timeout 100000

# Invalidate cache when source changes
RUN echo "Cache bust: ${CACHE_BUST}"

# Copy all the required packages and configs (source code)
COPY packages_ts/libs/types ./packages_ts/libs/types
COPY packages_ts/libs/constants ./packages_ts/libs/constants
COPY packages_ts/frontend/components/fact-search-ui ./packages_ts/frontend/components/fact-search-ui
COPY packages_ts/frontend/components/3d-graph-ui ./packages_ts/frontend/components/3d-graph-ui
COPY packages_ts/core/hsm-manager ./packages_ts/core/hsm-manager
COPY packages_ts/frontend/viewfinder ./packages_ts/frontend/viewfinder
COPY packages_ts/shared/testing ./packages_ts/shared/testing
COPY packages_ts/config/tsconfig.base.json ./packages_ts/config/tsconfig.base.json
COPY packages_ts/config/tsconfig.lib.json ./packages_ts/config/tsconfig.lib.json
COPY packages_ts/config/tsconfig.lib-react.json ./packages_ts/config/tsconfig.lib-react.json
COPY packages_ts/config/tsconfig.frontend.json ./packages_ts/config/tsconfig.frontend.json

# Build packages in order
WORKDIR /usr/src/app/packages_ts/libs/types
RUN yarn build

WORKDIR /usr/src/app/packages_ts/libs/constants
RUN yarn build

WORKDIR /usr/src/app/packages_ts/core/hsm-manager
RUN yarn build

WORKDIR /usr/src/app/packages_ts/frontend/components/fact-search-ui
RUN echo "VITE_RELICA_ARCHIVIST_API_URL=http://localhost:3000" > .env && \
    yarn build

WORKDIR /usr/src/app/packages_ts/frontend/components/3d-graph-ui
RUN yarn build

# Build the main application
WORKDIR /usr/src/app/packages_ts/frontend/viewfinder
RUN echo "VITE_RELICA_ARCHIVIST_API_URL=/api/archivist" > .env && \
    echo "VITE_RELICA_CC_API_URL=/api/clarity" >> .env && \
    echo "VITE_RELICA_CC_SOCKET_URL=/ws/clarity" >> .env && \
    echo "VITE_PORTAL_API_URL=/api/portal" >> .env && \
    echo "VITE_PORTAL_WS_URL=/ws/portal" >> .env && \
    echo "VITE_SHUTTER_API_URL=/api/shutter" >> .env && \
    echo "VITE_RELICA_NOUS_SOCKET_URL=/ws/nous" >> .env && \
    yarn build

# Production stage
FROM nginx:alpine

# Add nginx configuration for SPA with Reverse Proxy
RUN echo 'server { \
    listen 80; \
    server_name _; \
    \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy API requests to backend services \
    location /api/archivist/ { \
    proxy_pass http://archivist:3000/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    location /api/clarity/ { \
    proxy_pass http://clarity:2176/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    location /api/shutter/ { \
    proxy_pass http://shutter:2173/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    location /api/portal/ { \
    proxy_pass http://portal:2174/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Proxy WebSocket connections \
    location /ws/clarity/ { \
    proxy_pass http://clarity:2176/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "Upgrade"; \
    proxy_set_header Host $host; \
    } \
    \
    location /ws/portal/ { \
    proxy_pass http://portal:2174/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "Upgrade"; \
    proxy_set_header Host $host; \
    } \
    \
    location /ws/nous/ { \
    proxy_pass http://nous:2204/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "Upgrade"; \
    proxy_set_header Host $host; \
    } \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    # Cache static assets \
    location /assets { \
    expires 1y; \
    add_header Cache-Control "public, no-transform"; \
    root /usr/share/nginx/html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Copy the built files from build stage to nginx serving directory
COPY --from=build /usr/src/app/packages_ts/frontend/viewfinder/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]