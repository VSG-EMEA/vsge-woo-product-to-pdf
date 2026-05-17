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

/**
 * Registers custom metadata fields for the product REST API.
 * Optimized to return lightweight image sizes for attachments to reduce PDF file size.
 */
function register_rest_field_custom_metadata() {
	$keys = array(
		'brb_media_brochure',
		'brb_media_drawing',
		'brb_media_manuals',
		'brb_media_safety_datasheets',
		'brb_media_spare_parts',
		'_cdmm_p_id',
		'_company',
		'_gtin',
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

					$urls      = array();
					$lang_slug = isset( $_GET['lang'] ) ? sanitize_text_field( $_GET['lang'] ) : '';

					foreach ( $ids as $id ) {
						if ( is_numeric( $id ) && $id > 0 ) {
							$attachment_id = (int) $id;

							if ( $lang_slug && function_exists( 'pll_get_post' ) ) {
								$translated_id = pll_get_post( $attachment_id, $lang_slug );
								if ( $translated_id ) {
									$attachment_id = $translated_id;
								}
							}

							$full_url = wp_get_attachment_url( $attachment_id );
							if ( $full_url ) {
								$attachment = get_post( $attachment_id );
								$mpn        = get_post_meta( $attachment_id, '_sku', true );

								/**
								 * Optimization: Use 'medium' size for the primary URL if it's an image.
								 * This ensures that sections like "Technical Drawings" do not embed full-size raw images.
								 */
								$optimized_url = wp_get_attachment_image_url( $attachment_id, 'medium' );
								$url           = $optimized_url ? $optimized_url : $full_url;

								$urls[] = array(
									'id'          => $attachment_id,
									'url'         => $url,
									'title'       => $attachment ? html_entity_decode( $attachment->post_title, ENT_QUOTES, 'UTF-8' ) : sprintf( __( 'Document %d', 'vsge-woo-product-to-pdf' ), $attachment_id ),
									'mpn'         => $mpn ?? '',
									'thumbnail'   => wp_get_attachment_image_url( $attachment_id, 'thumbnail' ),
									'description' => $attachment ? html_entity_decode( $attachment->post_excerpt, ENT_QUOTES, 'UTF-8' ) : '',
								);
							}
						}
					}

					if ( ! empty( $urls ) ) {
						return $urls;
					}
				}
				return $val;
			},
		) );
	}
}

add_action( 'rest_api_init', 'register_rest_field_custom_metadata' );


/**
 * Registers linked product fields (accessories, related, etc.) for the product REST API.
 * Ensures optimized thumbnail sizes are returned for the frontend payload to keep PDFs lightweight.
 */
function register_rest_field_linked_product() {
	$types = get_option( 'vsge_pdf_linked_products', array( 'accessories', 'related', 'similar', 'components', 'delivery', 'package', 'brb_media_spare_parts' ) );
	if ( ! is_array( $types ) || empty( $types ) ) {
		$types = array( 'accessories', 'related', 'similar', 'components', 'delivery', 'package' );
	}
	foreach ( $types as $type ) {
		register_rest_field( 'product', $type, array(
			'get_callback' => function ( $post ) use ( $type ) {
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

				$products  = array();
				$lang_slug = isset( $_GET['lang'] ) ? sanitize_text_field( $_GET['lang'] ) : '';

				foreach ( $val as $product_id ) {
					if ( ! is_numeric( $product_id ) || empty( $product_id ) ) {
						continue;
					}

					$woo_id = (int) $product_id;

					if ( $lang_slug && function_exists( 'pll_get_post' ) ) {
						$translated_id = pll_get_post( $woo_id, $lang_slug );
						if ( $translated_id ) {
							$woo_id = $translated_id;
						}
					}

					$post_obj = get_post( $woo_id );

					if ( $post_obj && 'product' === $post_obj->post_type ) {
						$products[] = array(
							'id'          => $woo_id,
							'mpn'         => get_post_meta( $woo_id, '_sku', true ),
							'name'        => html_entity_decode( get_the_title( $woo_id ), ENT_QUOTES, 'UTF-8' ),
							'description' => html_entity_decode( get_post_field( 'post_excerpt', $woo_id ), ENT_QUOTES, 'UTF-8' ),
							'thumbnail'   => get_the_post_thumbnail_url( $woo_id, 'thumbnail' ) ?: '',
							'url'         => get_permalink( $woo_id ),
						);
					} else {
						// Fallback if not found
						$products[] = array(
							'id'          => 0,
							'mpn'         => $product_id,
							'name'        => 'Product ' . $product_id,
							'description' => '',
							'thumbnail'   => '',
							'url'         => '',
						);
					}
				}
				return $products;
			},
		) );
	}
}
add_action( 'rest_api_init', 'register_rest_field_linked_product' );


// Wordpress api for logo extension
add_action( 'rest_api_init', 'add_logo_to_JSON' );
function add_logo_to_JSON() {
    register_rest_field( 'product', 'page_logo_src', array(
            'get_callback'    => 'get_logo_src',
            'update_callback' => null,
            'schema'          => null,
        )
    );
}

function get_logo_src( $object, $field_name, $request ) {
    $custom_logo = get_option( 'vsge_pdf_custom_logo', '' );
    if ( ! empty( $custom_logo ) ) {
        return $custom_logo;
    }

    $site_icon_url = get_site_icon_url();

    if ( $site_icon_url ) {
        return $site_icon_url;
    }

    return null;
}

// Allow public access to WooCommerce REST API for reading products
add_filter( 'woocommerce_rest_check_permissions', function( $permission, $context, $object_id, $post_type ) {
    // Check if we are trying to 'read' a 'product'
    if ( $context === 'read' && ( $post_type === 'product' || $post_type === 'product_variation' ) ) {
        return true;
    }

    return $permission;
}, 10, 4 );

// IMPORTANT: WooCommerce also requires a "user" to be set for the REST API.
// This filter bypasses the authentication requirement for the product endpoint specifically.
add_filter( 'woocommerce_rest_is_request_to_rest_api', function( $is_rest_api ) {
    if ( strpos( $_SERVER['REQUEST_URI'], '/wc/v3/products' ) !== false ) {
        // Force WC to treat this as a standard request if no keys are provided
        if ( ! isset( $_SERVER['PHP_AUTH_USER'] ) && ! isset( $_GET['consumer_key'] ) ) {
            add_filter( 'determine_current_user', function( $user ) {
                // Return a dummy user ID (like 1) or simply ensure it's not 0
                // if you want to force allow public access.
                return $user > 0 ? $user : 1;
            }, 20 );
        }
    }
    return $is_rest_api;
});

add_filter( 'woocommerce_rest_prepare_product_object', 'vsge_pdf_translate_rest_attributes', 10, 3 );
function vsge_pdf_translate_rest_attributes( $response, $product, $request ) {
    $data = $response->get_data();
    if ( ! isset( $data['attributes'] ) ) {
        return $response;
    }

    $lang_slug = isset( $_GET['lang'] ) ? sanitize_text_field( $_GET['lang'] ) : '';
    if ( ! $lang_slug && function_exists( 'pll_current_language' ) ) {
        $lang_slug = pll_current_language( 'slug' );
    }

    $translated_attributes = array();
    $product_attrs = $product->get_attributes();

    foreach ( $data['attributes'] as $attr_data ) {
        $raw_name = $attr_data['slug'];
        
        if ( isset( $product_attrs[ $raw_name ] ) ) {
            $attribute = $product_attrs[ $raw_name ];
            $label = $attr_data['name'];
            
            if ( $attribute->is_taxonomy() ) {
                if ( function_exists( 'pll_translate_string' ) && $lang_slug ) {
                    $label = pll_translate_string( $label, $lang_slug );
                }
                
                $attr_data['name'] = html_entity_decode( $label, ENT_QUOTES, 'UTF-8' );

                $options = array();
                foreach ( $attribute->get_options() as $term_id ) {
                    $i18n_term_id = $term_id;
                    if ( function_exists( 'pll_get_term' ) && $lang_slug ) {
                        $translated_id = pll_get_term( $term_id, $lang_slug );
                        if ( $translated_id ) {
                            $i18n_term_id = $translated_id;
                        }
                    }
                    
                    $term_obj = get_term( $i18n_term_id );
                    if ( $term_obj && ! is_wp_error( $term_obj ) ) {
                        $options[] = html_entity_decode( $term_obj->name, ENT_QUOTES, 'UTF-8' );
                    }
                }
                $attr_data['options'] = $options;
            } else {
                $opts = array();
                foreach ( $attribute->get_options() as $opt ) {
                    $opts[] = html_entity_decode( $opt, ENT_QUOTES, 'UTF-8' );
                }
                $attr_data['options'] = $opts;
                $attr_data['name'] = html_entity_decode( $attr_data['name'], ENT_QUOTES, 'UTF-8' );
            }
        }
        $translated_attributes[] = $attr_data;
    }

    $data['attributes'] = $translated_attributes;
    $response->set_data( $data );

    return $response;
}
