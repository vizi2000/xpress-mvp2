FROM nginx:alpine

# Install bash for injection script
RUN apk add --no-cache bash

# Copy application files
COPY index-modular.html /usr/share/nginx/html/index.html
COPY index.html /usr/share/nginx/html/index-legacy.html
COPY src/ /usr/share/nginx/html/src/
COPY docs/ /usr/share/nginx/html/docs/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/
COPY config.local.js /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy environment injection script
COPY inject-env.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Expose port
EXPOSE 80

# nginx:alpine automatically runs scripts in /docker-entrypoint.d/
# Our inject-env.sh will run before nginx starts
