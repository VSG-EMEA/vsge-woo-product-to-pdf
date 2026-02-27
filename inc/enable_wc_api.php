<?php

function set_wc_data_store( $stores ) {
    $stores['product-variable']  = 'WC_Product_Variable_Data_Store_CPT';
    $stores['product-variation'] = 'WC_Product_Variation_Data_Store_CPT';

    return $stores;
}

add_filter( 'woocommerce_data_stores', 'set_wc_data_store' );

function enable_taxonomy_rest( $args ) {
    $args['show_in_rest'] = true;

    return $args;
}

add_filter( 'woocommerce_taxonomy_args_product_cat', 'enable_taxonomy_rest' );
add_filter( 'woocommerce_taxonomy_args_product_tag', 'enable_taxonomy_rest' );

function register_rest_field_approvals() {
    register_rest_field( 'product', "approvals", array(
            "get_callback" => function ( $post ) {
                return wp_get_post_terms( $post['id'], 'product_approvals' );
            }
        ) );
}

add_action( 'rest_api_init', 'register_rest_field_approvals' );


function register_rest_field_application() {
    register_rest_field( 'product', "application", array(
            "get_callback" => function ( $post ) {
                $terms = wp_get_post_terms( $post['id'], 'product_application' );
                if ( ! is_wp_error( $terms ) ) {
                    foreach ( $terms as &$term ) {
                        $term->tax_image_id = get_term_meta( $term->term_id, 'tax_image_id', true );
                    }
                }
                return $terms;
            }
        ) );
}

add_action( 'rest_api_init', 'register_rest_field_application' );

function register_rest_field_custom_metadata() {
    $keys = array( 
        'brb_media_brochure', 
        'brb_media_drawing', 
        'brb_media_manuals', 
        'brb_media_safety_datasheets', 
        'brb_media_spare_parts',
        '_cdmm_p_id',
        '_company',
        '_gtin'
    );
    foreach ( $keys as $key ) {
        register_rest_field( 'product', $key, array(
            'get_callback' => function ( $post ) use ( $key ) {
                $val = get_post_meta( $post['id'], $key, true );
                if ( strpos( $key, 'brb_media_' ) === 0 && ! empty( $val ) ) {
                    $ids = array();
                    if ( is_string( $val ) && strpos( $val, ',' ) !== false ) {
                        $ids = array_map( 'trim', explode( ',', $val ) );
                    } elseif ( is_numeric( $val ) || is_string( $val ) ) {
                        $ids = array( $val );
                    }
                    
                    $urls = array();
                    foreach ( $ids as $id ) {
                        if ( is_numeric( $id ) && $id > 0 ) {
                            $url = wp_get_attachment_url( (int) $id );
                            if ( $url ) {
                                $attachment = get_post( (int) $id );
                                $urls[] = array(
                                    'id' => (int) $id,
                                    'url' => $url,
                                    'title' => $attachment ? $attachment->post_title : 'Document ' . $id,
                                    'thumbnail' => wp_get_attachment_image_url( (int) $id, 'thumbnail' ),
                                    'description' => $attachment ? $attachment->post_excerpt : ''
                                );
                            }
                        }
                    }
                    
                    if ( ! empty( $urls ) ) {
                        return $urls;
                    }
                }
                return $val;
            }
        ) );
    }
}

add_action( 'rest_api_init', 'register_rest_field_custom_metadata' );


function register_rest_field_linked_product() {
    $types = array( "accessories", "related", "similar", "components", "delivery", "package" );
    foreach ( $types as $type ) {
        register_rest_field( 'product', $type, array(
                "get_callback" => function ( $post ) use ( $type ) {
                    $val = get_post_meta( $post['id'], '_' . $type . '_ids', true );
                    if ( is_string( $val ) && strpos( $val, ',' ) !== false ) {
                        $val = array_map( 'trim', explode( ',', $val ) );
                    } elseif ( is_string( $val ) && ! empty( $val ) ) {
                        $val = array( $val );
                    } elseif ( is_array( $val ) ) {
                        // Already an array from postmeta (e.g. from brb importer or serialized)
                        $val = array_values( $val );
                    } else {
                        $val = array();
                    }
                    
                    if ( empty( $val ) ) {
                        return array();
                    }

                    $products = array();
                    foreach ( $val as $product_id ) {
                        if ( ! is_numeric( $product_id ) || empty( $product_id ) ) continue;
                        
                        // It appears these are already WooCommerce post IDs locally stored!
                        $woo_id = (int) $product_id;
                        $post_obj = get_post( $woo_id );

                        if ( $post_obj && $post_obj->post_type === 'product' ) {
                            $products[] = array(
                                'id' => $woo_id,
                                'cdmm_p_id' => get_post_meta( $woo_id, '_cdmm_p_id', true ),
                                'name' => get_the_title( $woo_id ),
                                'description' => get_post_field( 'post_excerpt', $woo_id ),
                                'thumbnail' => get_the_post_thumbnail_url( $woo_id, 'thumbnail' ) ?: '',
                                'url' => get_permalink( $woo_id )
                            );
                        } else {
                            // Fallback if not found
                            $products[] = array(
                                'id' => 0,
                                'cdmm_p_id' => $product_id,
                                'name' => 'Product ' . $product_id,
                                'description' => '',
                                'thumbnail' => '',
                                'url' => ''
                            );
                        }
                    }
                    return $products;
                }
            ) );
    }
}

add_action( 'rest_api_init', 'register_rest_field_linked_product' );