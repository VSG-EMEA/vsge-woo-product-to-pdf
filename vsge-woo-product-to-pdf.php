<?php
/**
 * Plugin Name: vsge-woo-product-to-pdf
 * Version: 0.2.0
 * Description: VSGE - PDF Generator
 * Author:            codekraft
 * Text Domain:       vsge-woo-product-to-pdf
 * Domain Path:       languages/
 */

if ( ! defined( 'ABSPATH' ) ) exit;
if ( ! defined( 'VSGE_P2PDF_PATH' ) ) {
    define( 'VSGE_P2PDF_PATH', plugin_dir_path( __FILE__ ) );
}

add_action( 'init', function() {
    register_block_type( VSGE_P2PDF_PATH . '/build' );
} );

add_action( 'wp_enqueue_scripts', function() {
    $asset_file = VSGE_P2PDF_PATH . '/build/view.asset.php';
    $asset      = file_exists( $asset_file ) ? require $asset_file : array(
        'dependencies' => array(),
        'version'      => filemtime( VSGE_P2PDF_PATH . '/build/view.js' ),
    );

    wp_enqueue_script(
        'vsge-woo-product-to-pdf-view',
        plugin_dir_url( __FILE__ ) . 'build/view.js',
        $asset['dependencies'],
        $asset['version'],
        true // load in footer
    );

    wp_enqueue_style(
        'vsge-woo-product-to-pdf-view',
        plugin_dir_url( __FILE__ ) . 'build/view.css',
        array(),
        $asset['version']
    );
} );

require VSGE_P2PDF_PATH . '/inc/index.php';