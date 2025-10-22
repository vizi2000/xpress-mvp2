# Xpress Orders WordPress Plugin

Custom WordPress plugin for managing Xpress.Delivery orders via REST API.

**Version**: 1.0.0
**Author**: The Collective Borg.tools
**Server**: vizi@borg.tools (194.181.240.37)
**Domain**: https://api.sendxpress.borg.tools

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [API Endpoints](#api-endpoints)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Deploy to Server

```bash
cd wordpress
./deploy-wordpress.sh
```

### Complete WordPress Setup

1. Visit: https://api.sendxpress.borg.tools/wp-admin/install.php
2. Complete installation wizard (save credentials!)
3. Login to WordPress admin
4. Go to **Plugins** → Activate **Xpress Orders**
5. Plugin is now active and ready to use

---

## Installation

### Automated Deployment (Recommended)

```bash
# From xpress-mvp2/wordpress directory
./deploy-wordpress.sh
```

This script will:
- Create installation directory on server
- Download and install WordPress (if not exists)
- Upload plugin files
- Setup MySQL database
- Configure nginx with SSL
- Set proper file permissions

### Manual Installation

```bash
# 1. Upload plugin to server
rsync -avz wp-content/plugins/xpress-orders/ \
  vizi@borg.tools:/home/vizi/apps/wordpress-xpress/wp-content/plugins/xpress-orders/

# 2. SSH into server
ssh vizi@borg.tools

# 3. Set permissions
sudo chown -R www-data:www-data /home/vizi/apps/wordpress-xpress
sudo find /home/vizi/apps/wordpress-xpress -type d -exec chmod 755 {} \;
sudo find /home/vizi/apps/wordpress-xpress -type f -exec chmod 644 {} \;

# 4. Restart services
sudo systemctl reload nginx php8.1-fpm
```

---

## API Endpoints

### Base URL
```
https://api.sendxpress.borg.tools/wp-json/xpress/v1
```

### Authentication

Protected endpoints require API key in header:
```
X-API-Key: xpress_secret_key_2025
```

---

### 1. Create Order

**Endpoint**: `POST /orders`
**Auth**: Required
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "pickup": "ul. Krakowska 123, Warszawa",
  "delivery": "ul. Marszałkowska 45, Warszawa",
  "pickupCoords": {
    "lat": 52.2297,
    "lng": 21.0122
  },
  "deliveryCoords": {
    "lat": 52.2319,
    "lng": 21.0067
  },
  "size": "small",
  "contact": {
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "phone": "+48123456789"
  },
  "distance": "5.2 km",
  "timeEstimate": "~25 min",
  "price": 45.00,
  "paymentMethod": "card"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "order_id": 123,
  "tracking_code": "XPR-20251022-AB12CD",
  "message": "Order created successfully"
}
```

**cURL Example**:
```bash
curl -X POST https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpress_secret_key_2025" \
  -d '{
    "pickup": "ul. Krakowska 123, Warszawa",
    "delivery": "ul. Marszałkowska 45, Warszawa",
    "pickupCoords": {"lat": 52.2297, "lng": 21.0122},
    "deliveryCoords": {"lat": 52.2319, "lng": 21.0067},
    "size": "small",
    "contact": {"name": "Jan Kowalski", "email": "jan@example.com", "phone": "+48123456789"},
    "distance": "5.2 km",
    "timeEstimate": "~25 min",
    "price": 45.00,
    "paymentMethod": "card"
  }'
```

---

### 2. Get Order by ID

**Endpoint**: `GET /orders/{id}`
**Auth**: Required

**Response** (200 OK):
```json
{
  "id": 123,
  "tracking_code": "XPR-20251022-AB12CD",
  "pickup_address": "ul. Krakowska 123, Warszawa",
  "delivery_address": "ul. Marszałkowska 45, Warszawa",
  "pickup_coords": {"lat": 52.2297, "lng": 21.0122},
  "delivery_coords": {"lat": 52.2319, "lng": 21.0067},
  "package_size": "small",
  "contact": {
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "phone": "+48123456789"
  },
  "distance": "5.2 km",
  "time_estimate": "~25 min",
  "price": 45.00,
  "status": "pending",
  "payment_method": "card",
  "payment_status": "pending",
  "created_at": "2025-10-22 14:30:00"
}
```

**cURL Example**:
```bash
curl -X GET https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders/123 \
  -H "X-API-Key: xpress_secret_key_2025"
```

---

### 3. Track Order (Public)

**Endpoint**: `GET /track/{tracking_code}`
**Auth**: Not required (public endpoint)

**Example**: `GET /track/XPR-20251022-AB12CD`

**Response**: Same as Get Order by ID

**cURL Example**:
```bash
curl -X GET https://api.sendxpress.borg.tools/wp-json/xpress/v1/track/XPR-20251022-AB12CD
```

---

### 4. List Orders

**Endpoint**: `GET /orders`
**Auth**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, confirmed, picked_up, in_transit, delivered, cancelled)

**Response** (200 OK):
```json
{
  "orders": [...],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8
}
```

**cURL Example**:
```bash
curl -X GET "https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders?page=1&per_page=20&status=pending" \
  -H "X-API-Key: xpress_secret_key_2025"
```

---

### 5. Update Order Status

**Endpoint**: `PUT /orders/{id}/status`
**Auth**: Required

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Valid Statuses**:
- `pending` - Order created, awaiting confirmation
- `confirmed` - Order confirmed by courier
- `picked_up` - Package picked up from sender
- `in_transit` - Package in transit
- `delivered` - Package delivered
- `cancelled` - Order cancelled

**Response** (200 OK):
```json
{
  "success": true,
  "order_id": 123,
  "status": "confirmed",
  "message": "Order status updated successfully"
}
```

**cURL Example**:
```bash
curl -X PUT https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders/123/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpress_secret_key_2025" \
  -d '{"status": "confirmed"}'
```

---

### 6. Newsletter Subscription

**Endpoint**: `POST /newsletter`
**Auth**: Not required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "subscriber_id": 45
}
```

**cURL Example**:
```bash
curl -X POST https://api.sendxpress.borg.tools/wp-json/xpress/v1/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

### 7. Newsletter Unsubscribe

**Endpoint**: `POST /newsletter/unsubscribe`
**Auth**: Not required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter"
}
```

---

### 8. List Newsletter Subscribers

**Endpoint**: `GET /newsletter/subscribers`
**Auth**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50)

**Response** (200 OK):
```json
{
  "subscribers": [
    {
      "id": 45,
      "email": "user@example.com",
      "subscribed_at": "2025-10-22 14:30:00",
      "subscribed_date": "2025-10-22 14:30:00"
    }
  ],
  "total": 120,
  "page": 1,
  "per_page": 50,
  "total_pages": 3
}
```

---

## Configuration

### Change API Key

1. Login to WordPress admin
2. Go to **Plugins** → **Plugin File Editor**
3. Select **Xpress Orders**
4. Or use MySQL:

```sql
-- Update API key in WordPress options
UPDATE wp_options
SET option_value = 'your_new_secret_key_here'
WHERE option_name = 'xpress_api_key';
```

Or add to `wp-config.php`:
```php
define('XPRESS_API_KEY', 'your_secret_key_here');
```

Then update `class-api.php`:
```php
public function __construct() {
    $this->api_key = defined('XPRESS_API_KEY')
        ? XPRESS_API_KEY
        : get_option('xpress_api_key', 'xpress_secret_key_2025');
    // ...
}
```

### Database Configuration

Database credentials are set during installation. To view:

```bash
ssh vizi@borg.tools
cat /home/vizi/apps/wordpress-xpress/wp-config.php | grep DB_
```

---

## Testing

### Test Order Creation

```bash
# Test endpoint
curl -X POST https://api.sendxpress.borg.tools/wp-json/xpress/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpress_secret_key_2025" \
  -d '{
    "pickup": "Test Pickup Address",
    "delivery": "Test Delivery Address",
    "pickupCoords": {"lat": 52.2297, "lng": 21.0122},
    "deliveryCoords": {"lat": 52.2319, "lng": 21.0067},
    "size": "small",
    "contact": {"name": "Test User", "email": "test@example.com", "phone": "+48123456789"},
    "distance": "5 km",
    "timeEstimate": "20 min",
    "price": 40.00,
    "paymentMethod": "card"
  }'
```

### Test Order Tracking

```bash
# Replace with actual tracking code from order creation
curl -X GET https://api.sendxpress.borg.tools/wp-json/xpress/v1/track/XPR-20251022-AB12CD
```

### Test Newsletter Subscription

```bash
curl -X POST https://api.sendxpress.borg.tools/wp-json/xpress/v1/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Check Plugin Status

```bash
ssh vizi@borg.tools
cd /home/vizi/apps/wordpress-xpress
wp plugin list --allow-root
```

---

## Security

### API Key Management

1. **Never commit API keys to git**
2. Store in environment variables or `wp-config.php`
3. Use strong, random keys (minimum 32 characters)
4. Rotate keys regularly
5. Use HTTPS for all API calls

### Generate Strong API Key

```bash
openssl rand -base64 32
```

### CORS Configuration

CORS is enabled by default in `class-api.php`. To restrict origins:

```php
public function add_cors_headers($served) {
    header('Access-Control-Allow-Origin: https://sendxpress.borg.tools'); // Specific domain
    // ... rest of headers
}
```

### File Permissions

```bash
# Verify correct permissions
ssh vizi@borg.tools
ls -la /home/vizi/apps/wordpress-xpress/wp-content/plugins/xpress-orders/
# Should show: drwxr-xr-x www-data www-data
```

---

## Troubleshooting

### Plugin Not Showing in WordPress Admin

```bash
ssh vizi@borg.tools
cd /home/vizi/apps/wordpress-xpress/wp-content/plugins
ls -la xpress-orders/
# Verify xpress-orders.php exists
```

### API Endpoints Return 404

1. Check permalink settings:
   - WordPress Admin → Settings → Permalinks
   - Select "Post name" structure
   - Save changes

2. Flush rewrite rules:
```bash
ssh vizi@borg.tools
cd /home/vizi/apps/wordpress-xpress
wp rewrite flush --allow-root
```

### API Returns 403 Forbidden

- Check API key in request header
- Verify API key matches WordPress configuration
- Check `X-API-Key` header is correctly formatted

### Orders Not Saving

1. Check database permissions:
```bash
ssh vizi@borg.tools
mysql -u xpress_wp_user -p xpress_wp
SHOW TABLES;
# Should show wp_posts, wp_postmeta, etc.
```

2. Check PHP error log:
```bash
tail -f /var/log/nginx/error.log
```

### SSL Issues

```bash
# Renew certificate
ssh vizi@borg.tools
sudo certbot renew
sudo systemctl reload nginx
```

### File Upload Issues

```bash
# Check PHP upload limits
ssh vizi@borg.tools
grep upload_max /etc/php/8.1/fpm/php.ini
# Should be at least 64M
```

---

## Plugin Structure

```
xpress-orders/
├── xpress-orders.php          # Main plugin file
└── includes/
    ├── class-cpt.php          # Custom Post Types (Orders, Subscribers)
    ├── class-api.php          # REST API endpoints
    └── class-newsletter.php   # Newsletter management
```

---

## WordPress Admin Features

### Order Management

1. Go to **Orders** menu in WordPress admin
2. View all orders with tracking codes
3. Edit order details and update status
4. Search orders by tracking code, address, or contact info

### Subscriber Management

1. Go to **Subscribers** menu
2. View all newsletter subscribers
3. Export subscriber list (use plugins like WP All Export)
4. Manually add/remove subscribers

---

## API Response Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Support

**Server**: vizi@borg.tools
**Developer**: The Collective Borg.tools
**Project**: Xpress.Delivery MVP

For issues, check:
1. This README
2. WordPress error logs: `/var/log/nginx/error.log`
3. PHP error logs: `/var/log/php8.1-fpm.log`

---

## Changelog

### Version 1.0.0 (2025-10-22)
- Initial release
- Order management via REST API
- Order tracking (public endpoint)
- Newsletter subscription management
- CORS support for frontend integration
- Custom Post Types for orders and subscribers

---

Created by The Collective Borg.tools
