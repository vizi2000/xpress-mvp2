<?php
/**
 * Custom Post Type Registration
 * Handles xpress_order and xpress_subscriber post types
 */

class Xpress_Orders_CPT {
    public static function register() {
        // Register Orders CPT
        register_post_type('xpress_order', [
            'labels' => [
                'name' => 'Orders',
                'singular_name' => 'Order',
                'add_new' => 'Add New Order',
                'add_new_item' => 'Add New Order',
                'edit_item' => 'Edit Order',
                'view_item' => 'View Order',
                'search_items' => 'Search Orders',
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-cart',
            'capability_type' => 'post',
            'has_archive' => false,
            'hierarchical' => false,
            'supports' => ['title', 'custom-fields'],
            'rewrite' => false
        ]);

        // Register Subscribers CPT
        register_post_type('xpress_subscriber', [
            'labels' => [
                'name' => 'Subscribers',
                'singular_name' => 'Subscriber',
                'add_new' => 'Add New Subscriber',
                'edit_item' => 'Edit Subscriber',
                'view_item' => 'View Subscriber',
                'search_items' => 'Search Subscribers',
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-email',
            'capability_type' => 'post',
            'has_archive' => false,
            'hierarchical' => false,
            'supports' => ['title'],
            'rewrite' => false
        ]);

        // Register meta fields for orders
        self::register_meta_fields();
    }

    private static function register_meta_fields() {
        $fields = [
            'tracking_code' => 'string',
            'pickup_address' => 'string',
            'delivery_address' => 'string',
            'pickup_coords_lat' => 'number',
            'pickup_coords_lng' => 'number',
            'delivery_coords_lat' => 'number',
            'delivery_coords_lng' => 'number',
            'package_size' => 'string',
            'contact_name' => 'string',
            'contact_email' => 'string',
            'contact_phone' => 'string',
            'distance' => 'string',
            'time_estimate' => 'string',
            'price' => 'number',
            'status' => 'string',
            'payment_method' => 'string',
            'payment_status' => 'string',
            'created_at' => 'string'
        ];

        foreach ($fields as $key => $type) {
            register_post_meta('xpress_order', '_' . $key, [
                'type' => $type,
                'single' => true,
                'show_in_rest' => true,
                'sanitize_callback' => 'sanitize_text_field'
            ]);
        }

        // Register subscriber meta fields
        register_post_meta('xpress_subscriber', '_subscriber_email', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_email'
        ]);

        register_post_meta('xpress_subscriber', '_subscribed_at', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true
        ]);
    }
}
