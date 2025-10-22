#!/bin/bash
# WordPress Deployment Script for api.sendxpress.borg.tools
# Created by The Collective Borg.tools

set -e

echo "🚀 Deploying WordPress for Xpress.Delivery..."

# Variables
DOMAIN="api.sendxpress.borg.tools"
SERVER="vizi@borg.tools"
INSTALL_DIR="/home/vizi/apps/wordpress-xpress"
DB_NAME="xpress_wp"
DB_USER="xpress_wp_user"
WP_VERSION="latest"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Create installation directory
echo ""
echo "📁 Creating installation directory..."
ssh $SERVER "mkdir -p $INSTALL_DIR"
print_status "Installation directory created: $INSTALL_DIR"

# 2. Check if WordPress is already installed
echo ""
echo "🔍 Checking existing WordPress installation..."
WP_EXISTS=$(ssh $SERVER "test -f $INSTALL_DIR/wp-config.php && echo 'yes' || echo 'no'")

if [ "$WP_EXISTS" = "yes" ]; then
    print_warning "WordPress already installed. Skipping WordPress download."
else
    echo "📥 Downloading WordPress..."
    ssh $SERVER "cd $INSTALL_DIR && wget -q https://wordpress.org/latest.tar.gz && tar -xzf latest.tar.gz --strip-components=1 && rm latest.tar.gz"
    print_status "WordPress downloaded and extracted"
fi

# 3. Upload plugin files
echo ""
echo "📤 Uploading plugin files..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='*.md' \
  --exclude='*.sh' \
  wp-content/plugins/xpress-orders/ \
  $SERVER:$INSTALL_DIR/wp-content/plugins/xpress-orders/
print_status "Plugin files uploaded"

# 4. Setup database (if needed)
echo ""
echo "🗄️  Setting up database..."
ssh $SERVER << 'ENDSSH'
DB_NAME="xpress_wp"
DB_USER="xpress_wp_user"
DB_PASS=$(openssl rand -base64 24)

# Check if database exists
DB_EXISTS=$(mysql -u root -e "SHOW DATABASES LIKE '$DB_NAME';" | grep "$DB_NAME" > /dev/null; echo "$?")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "Database already exists. Skipping creation."
else
    echo "Creating database and user..."
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    echo "Database credentials:"
    echo "DB_NAME: $DB_NAME"
    echo "DB_USER: $DB_USER"
    echo "DB_PASS: $DB_PASS"
    echo ""
    echo "⚠️  SAVE THESE CREDENTIALS - YOU'LL NEED THEM FOR wp-config.php"
fi
ENDSSH
print_status "Database setup completed"

# 5. Setup nginx configuration
echo ""
echo "🔧 Configuring nginx..."
ssh $SERVER "sudo bash -c 'cat > /etc/nginx/sites-available/xpress-wp << \"EOF\"
server {
    listen 80;
    server_name api.sendxpress.borg.tools;

    root /home/vizi/apps/wordpress-xpress;
    index index.php index.html;

    client_max_body_size 64M;

    location / {
        try_files \\\$uri \\\$uri/ /index.php?\\\$args;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \\\$document_root\\\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }

    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    location = /robots.txt {
        log_not_found off;
        access_log off;
        allow all;
    }

    location ~* \.(css|gif|ico|jpeg|jpg|js|png)$ {
        expires max;
        log_not_found off;
    }
}
EOF
'"
ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/xpress-wp /etc/nginx/sites-enabled/"
ssh $SERVER "sudo nginx -t && sudo systemctl reload nginx"
print_status "Nginx configured and reloaded"

# 6. Setup SSL with Certbot
echo ""
echo "🔒 Setting up SSL certificate..."
SSL_EXISTS=$(ssh $SERVER "sudo test -d /etc/letsencrypt/live/api.sendxpress.borg.tools && echo 'yes' || echo 'no'")

if [ "$SSL_EXISTS" = "yes" ]; then
    print_warning "SSL certificate already exists. Skipping certbot."
else
    ssh $SERVER "sudo certbot --nginx -d api.sendxpress.borg.tools --non-interactive --agree-tos -m admin@borg.tools"
    print_status "SSL certificate installed"
fi

# 7. Set correct permissions
echo ""
echo "🔐 Setting file permissions..."
ssh $SERVER "sudo chown -R www-data:www-data $INSTALL_DIR"
ssh $SERVER "sudo find $INSTALL_DIR -type d -exec chmod 755 {} \;"
ssh $SERVER "sudo find $INSTALL_DIR -type f -exec chmod 644 {} \;"
print_status "Permissions set"

# 8. Verify plugin installation
echo ""
echo "✅ Verifying plugin installation..."
PLUGIN_EXISTS=$(ssh $SERVER "test -f $INSTALL_DIR/wp-content/plugins/xpress-orders/xpress-orders.php && echo 'yes' || echo 'no'")

if [ "$PLUGIN_EXISTS" = "yes" ]; then
    print_status "Plugin successfully deployed"
else
    print_error "Plugin not found! Check deployment."
    exit 1
fi

echo ""
echo "========================================"
echo "✅ WordPress deployment complete!"
echo "========================================"
echo ""
echo "🌐 Access your WordPress installation:"
echo "   https://api.sendxpress.borg.tools"
echo ""
echo "📋 Next steps:"
echo "   1. Visit https://api.sendxpress.borg.tools/wp-admin/install.php"
echo "   2. Complete WordPress installation wizard"
echo "   3. Go to Plugins → Activate 'Xpress Orders'"
echo "   4. Update API key in WordPress Settings (if needed)"
echo ""
echo "🔑 Default API Key: xpress_secret_key_2025"
echo "   (Change this in WordPress admin after activation)"
echo ""
echo "📖 API Documentation:"
echo "   POST https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders"
echo "   GET  https://api.sendxpress.borg.tools/wp-json/xpress/v1/track/{code}"
echo ""
echo "Created by The Collective Borg.tools"
