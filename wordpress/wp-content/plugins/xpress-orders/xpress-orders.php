<?php
/**
 * Plugin Name: Xpress Orders
 * Description: Custom order management for Xpress.Delivery
 * Version: 1.0.0
 * Author: The Collective Borg.tools
 * Text Domain: xpress-orders
 */

if (!defined('ABSPATH')) exit;

// Constants
define('XPRESS_ORDERS_VERSION', '1.0.0');
define('XPRESS_ORDERS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('XPRESS_ORDERS_PLUGIN_URL', plugin_dir_url(__FILE__));

// Autoload classes
spl_autoload_register(function($class) {
    $prefix = 'Xpress_Orders_';
    if (strpos($class, $prefix) === 0) {
        $class_file = str_replace('_', '-', strtolower(substr($class, strlen($prefix))));
        $file = XPRESS_ORDERS_PLUGIN_DIR . 'includes/class-' . $class_file . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

// Initialize plugin
function xpress_orders_init() {
    // Register Custom Post Type
    Xpress_Orders_CPT::register();

    // Initialize REST API
    new Xpress_Orders_API();

    // Initialize Newsletter
    new Xpress_Orders_Newsletter();
}
add_action('init', 'xpress_orders_init');

// Activation hook
register_activation_hook(__FILE__, function() {
    xpress_orders_init();
    flush_rewrite_rules();
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
