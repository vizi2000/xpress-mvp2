<?php
/**
 * REST API Handler
 * Provides endpoints for order management and tracking
 */

class Xpress_Orders_API {
    private $api_key;

    public function __construct() {
        $this->api_key = get_option('xpress_api_key', 'xpress_secret_key_2025');
        add_action('rest_api_init', [$this, 'register_routes']);
        add_filter('rest_pre_serve_request', [$this, 'add_cors_headers']);
    }

    public function register_routes() {
        // Create order
        register_rest_route('xpress/v1', '/orders', [
            'methods' => 'POST',
            'callback' => [$this, 'create_order'],
            'permission_callback' => [$this, 'verify_api_key']
        ]);

        // Get order by ID
        register_rest_route('xpress/v1', '/orders/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_order'],
            'permission_callback' => [$this, 'verify_api_key']
        ]);

        // Track order (public endpoint)
        register_rest_route('xpress/v1', '/track/(?P<code>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'track_order'],
            'permission_callback' => '__return_true'
        ]);

        // List orders
        register_rest_route('xpress/v1', '/orders', [
            'methods' => 'GET',
            'callback' => [$this, 'list_orders'],
            'permission_callback' => [$this, 'verify_api_key']
        ]);

        // Update order status
        register_rest_route('xpress/v1', '/orders/(?P<id>\d+)/status', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_status'],
            'permission_callback' => [$this, 'verify_api_key']
        ]);
    }

    public function verify_api_key($request) {
        $provided_key = $request->get_header('X-API-Key');
        return $provided_key === $this->api_key;
    }

    public function add_cors_headers($served) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }

        return $served;
    }

    public function create_order($request) {
        $params = $request->get_json_params();

        // Validate required fields
        if (empty($params['pickup']) || empty($params['delivery'])) {
            return new WP_Error('missing_fields', 'Pickup and delivery addresses are required', ['status' => 400]);
        }

        // Generate tracking code
        $tracking_code = 'XPR-' . date('Ymd') . '-' . strtoupper(wp_generate_password(6, false));

        // Create order
        $order_id = wp_insert_post([
            'post_type' => 'xpress_order',
            'post_title' => $tracking_code,
            'post_status' => 'publish'
        ]);

        if (is_wp_error($order_id)) {
            return new WP_Error('create_failed', 'Failed to create order', ['status' => 500]);
        }

        // Save meta data
        $meta_fields = [
            'tracking_code' => $tracking_code,
            'pickup_address' => sanitize_text_field($params['pickup'] ?? ''),
            'delivery_address' => sanitize_text_field($params['delivery'] ?? ''),
            'pickup_coords_lat' => floatval($params['pickupCoords']['lat'] ?? 0),
            'pickup_coords_lng' => floatval($params['pickupCoords']['lng'] ?? 0),
            'delivery_coords_lat' => floatval($params['deliveryCoords']['lat'] ?? 0),
            'delivery_coords_lng' => floatval($params['deliveryCoords']['lng'] ?? 0),
            'package_size' => sanitize_text_field($params['size'] ?? 'small'),
            'contact_name' => sanitize_text_field($params['contact']['name'] ?? ''),
            'contact_email' => sanitize_email($params['contact']['email'] ?? ''),
            'contact_phone' => sanitize_text_field($params['contact']['phone'] ?? ''),
            'distance' => sanitize_text_field($params['distance'] ?? ''),
            'time_estimate' => sanitize_text_field($params['timeEstimate'] ?? ''),
            'price' => floatval($params['price'] ?? 0),
            'status' => 'pending',
            'payment_method' => sanitize_text_field($params['paymentMethod'] ?? 'card'),
            'payment_status' => 'pending',
            'created_at' => current_time('mysql')
        ];

        foreach ($meta_fields as $key => $value) {
            update_post_meta($order_id, '_' . $key, $value);
        }

        return [
            'success' => true,
            'order_id' => $order_id,
            'tracking_code' => $tracking_code,
            'message' => 'Order created successfully'
        ];
    }

    public function get_order($request) {
        $order_id = $request['id'];
        $order = get_post($order_id);

        if (!$order || $order->post_type !== 'xpress_order') {
            return new WP_Error('not_found', 'Order not found', ['status' => 404]);
        }

        return $this->format_order($order);
    }

    public function track_order($request) {
        $tracking_code = strtoupper($request['code']);

        $orders = get_posts([
            'post_type' => 'xpress_order',
            'meta_key' => '_tracking_code',
            'meta_value' => $tracking_code,
            'posts_per_page' => 1
        ]);

        if (empty($orders)) {
            return new WP_Error('not_found', 'Order not found', ['status' => 404]);
        }

        return $this->format_order($orders[0]);
    }

    public function list_orders($request) {
        $page = $request->get_param('page') ?? 1;
        $per_page = $request->get_param('per_page') ?? 20;
        $status = $request->get_param('status');

        $args = [
            'post_type' => 'xpress_order',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'DESC'
        ];

        if ($status) {
            $args['meta_query'] = [
                [
                    'key' => '_status',
                    'value' => $status
                ]
            ];
        }

        $orders = get_posts($args);
        $total = wp_count_posts('xpress_order')->publish;

        return [
            'orders' => array_map([$this, 'format_order'], $orders),
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page)
        ];
    }

    public function update_status($request) {
        $order_id = $request['id'];
        $params = $request->get_json_params();
        $new_status = sanitize_text_field($params['status'] ?? '');

        $valid_statuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        if (!in_array($new_status, $valid_statuses)) {
            return new WP_Error('invalid_status', 'Invalid status value', ['status' => 400]);
        }

        $order = get_post($order_id);
        if (!$order || $order->post_type !== 'xpress_order') {
            return new WP_Error('not_found', 'Order not found', ['status' => 404]);
        }

        update_post_meta($order_id, '_status', $new_status);

        return [
            'success' => true,
            'order_id' => $order_id,
            'status' => $new_status,
            'message' => 'Order status updated successfully'
        ];
    }

    private function format_order($order) {
        $meta = get_post_meta($order->ID);

        return [
            'id' => $order->ID,
            'tracking_code' => $meta['_tracking_code'][0] ?? '',
            'pickup_address' => $meta['_pickup_address'][0] ?? '',
            'delivery_address' => $meta['_delivery_address'][0] ?? '',
            'pickup_coords' => [
                'lat' => floatval($meta['_pickup_coords_lat'][0] ?? 0),
                'lng' => floatval($meta['_pickup_coords_lng'][0] ?? 0)
            ],
            'delivery_coords' => [
                'lat' => floatval($meta['_delivery_coords_lat'][0] ?? 0),
                'lng' => floatval($meta['_delivery_coords_lng'][0] ?? 0)
            ],
            'package_size' => $meta['_package_size'][0] ?? '',
            'contact' => [
                'name' => $meta['_contact_name'][0] ?? '',
                'email' => $meta['_contact_email'][0] ?? '',
                'phone' => $meta['_contact_phone'][0] ?? ''
            ],
            'distance' => $meta['_distance'][0] ?? '',
            'time_estimate' => $meta['_time_estimate'][0] ?? '',
            'price' => floatval($meta['_price'][0] ?? 0),
            'status' => $meta['_status'][0] ?? 'pending',
            'payment_method' => $meta['_payment_method'][0] ?? '',
            'payment_status' => $meta['_payment_status'][0] ?? 'pending',
            'created_at' => $meta['_created_at'][0] ?? '',
            'created_date' => get_the_date('Y-m-d H:i:s', $order->ID)
        ];
    }
}
