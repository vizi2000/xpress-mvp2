<?php
/**
 * Newsletter Handler
 * Manages newsletter subscriptions
 */

class Xpress_Orders_Newsletter {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Subscribe to newsletter
        register_rest_route('xpress/v1', '/newsletter', [
            'methods' => 'POST',
            'callback' => [$this, 'subscribe'],
            'permission_callback' => '__return_true'
        ]);

        // List subscribers (protected)
        register_rest_route('xpress/v1', '/newsletter/subscribers', [
            'methods' => 'GET',
            'callback' => [$this, 'list_subscribers'],
            'permission_callback' => [$this, 'verify_api_key']
        ]);

        // Unsubscribe
        register_rest_route('xpress/v1', '/newsletter/unsubscribe', [
            'methods' => 'POST',
            'callback' => [$this, 'unsubscribe'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function verify_api_key($request) {
        $api_key = get_option('xpress_api_key', 'xpress_secret_key_2025');
        $provided_key = $request->get_header('X-API-Key');
        return $provided_key === $api_key;
    }

    public function subscribe($request) {
        $params = $request->get_json_params();
        $email = sanitize_email($params['email'] ?? '');

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email address', ['status' => 400]);
        }

        // Check if already subscribed
        $existing = get_posts([
            'post_type' => 'xpress_subscriber',
            'meta_key' => '_subscriber_email',
            'meta_value' => $email,
            'posts_per_page' => 1,
            'post_status' => 'publish'
        ]);

        if (!empty($existing)) {
            return [
                'success' => false,
                'message' => 'Email already subscribed'
            ];
        }

        // Create subscriber
        $subscriber_id = wp_insert_post([
            'post_type' => 'xpress_subscriber',
            'post_title' => $email,
            'post_status' => 'publish'
        ]);

        if (is_wp_error($subscriber_id)) {
            return new WP_Error('subscription_failed', 'Failed to subscribe', ['status' => 500]);
        }

        update_post_meta($subscriber_id, '_subscriber_email', $email);
        update_post_meta($subscriber_id, '_subscribed_at', current_time('mysql'));

        return [
            'success' => true,
            'message' => 'Successfully subscribed to newsletter',
            'subscriber_id' => $subscriber_id
        ];
    }

    public function unsubscribe($request) {
        $params = $request->get_json_params();
        $email = sanitize_email($params['email'] ?? '');

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email address', ['status' => 400]);
        }

        // Find subscriber
        $subscribers = get_posts([
            'post_type' => 'xpress_subscriber',
            'meta_key' => '_subscriber_email',
            'meta_value' => $email,
            'posts_per_page' => 1,
            'post_status' => 'publish'
        ]);

        if (empty($subscribers)) {
            return new WP_Error('not_found', 'Email not found in subscribers', ['status' => 404]);
        }

        // Delete subscriber
        $result = wp_delete_post($subscribers[0]->ID, true);

        if (!$result) {
            return new WP_Error('unsubscribe_failed', 'Failed to unsubscribe', ['status' => 500]);
        }

        return [
            'success' => true,
            'message' => 'Successfully unsubscribed from newsletter'
        ];
    }

    public function list_subscribers($request) {
        $page = $request->get_param('page') ?? 1;
        $per_page = $request->get_param('per_page') ?? 50;

        $subscribers = get_posts([
            'post_type' => 'xpress_subscriber',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'DESC',
            'post_status' => 'publish'
        ]);

        $total = wp_count_posts('xpress_subscriber')->publish;

        $formatted_subscribers = array_map(function($subscriber) {
            $email = get_post_meta($subscriber->ID, '_subscriber_email', true);
            $subscribed_at = get_post_meta($subscriber->ID, '_subscribed_at', true);

            return [
                'id' => $subscriber->ID,
                'email' => $email,
                'subscribed_at' => $subscribed_at,
                'subscribed_date' => get_the_date('Y-m-d H:i:s', $subscriber->ID)
            ];
        }, $subscribers);

        return [
            'subscribers' => $formatted_subscribers,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page)
        ];
    }
}
