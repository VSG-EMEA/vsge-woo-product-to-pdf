<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function vsge_pdf_register_settings() {
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_primary_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_black_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_white_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_grey_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_secondary_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_muted_color' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_font_family' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_linked_products' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_page_size' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_page_margins' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_custom_logo' );
    register_setting( 'vsge_pdf_options_group', 'vsge_pdf_footer_phrase' );

    add_settings_section( 'vsge_pdf_main_section', 'Main Settings', null, 'vsge_pdf_settings' );
    add_settings_section( 'vsge_pdf_colors_section', 'Color Settings', null, 'vsge_pdf_settings' );

    add_settings_field( 'vsge_pdf_primary_color', 'Primary Color', 'vsge_pdf_primary_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_black_color', 'Black Color', 'vsge_pdf_black_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_white_color', 'White Color', 'vsge_pdf_white_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_grey_color', 'Grey Color', 'vsge_pdf_grey_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_secondary_color', 'Secondary Color', 'vsge_pdf_secondary_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_muted_color', 'Muted Color', 'vsge_pdf_muted_color_cb', 'vsge_pdf_settings', 'vsge_pdf_colors_section' );
    add_settings_field( 'vsge_pdf_font_family', 'Font Family', 'vsge_pdf_font_family_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
    add_settings_field( 'vsge_pdf_page_size', 'Page Size', 'vsge_pdf_page_size_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
    add_settings_field( 'vsge_pdf_page_margins', 'Page Margins (Left, Top, Right, Bottom)', 'vsge_pdf_page_margins_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
    add_settings_field( 'vsge_pdf_linked_products', 'Linked Products', 'vsge_pdf_linked_products_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
    add_settings_field( 'vsge_pdf_custom_logo', 'Custom Logo', 'vsge_pdf_custom_logo_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
    add_settings_field( 'vsge_pdf_footer_phrase', 'Footer Phrase', 'vsge_pdf_footer_phrase_cb', 'vsge_pdf_settings', 'vsge_pdf_main_section' );
}
add_action( 'admin_init', 'vsge_pdf_register_settings' );

function vsge_pdf_add_options_page() {
    add_options_page( 'VSGE PDF Settings', 'VSGE PDF Settings', 'manage_options', 'vsge_pdf_settings', 'vsge_pdf_options_page_html' );
}
add_action( 'admin_menu', 'vsge_pdf_add_options_page' );

function vsge_pdf_primary_color_cb() {
    $val = get_option( 'vsge_pdf_primary_color', '#C8102E' );
    echo '<input type="color" name="vsge_pdf_primary_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_black_color_cb() {
    $val = get_option( 'vsge_pdf_black_color', '#000000' );
    echo '<input type="color" name="vsge_pdf_black_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_white_color_cb() {
    $val = get_option( 'vsge_pdf_white_color', '#FFFFFF' );
    echo '<input type="color" name="vsge_pdf_white_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_grey_color_cb() {
    $val = get_option( 'vsge_pdf_grey_color', '#F3F3F3' );
    echo '<input type="color" name="vsge_pdf_grey_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_secondary_color_cb() {
    $val = get_option( 'vsge_pdf_secondary_color', '#FFD700' );
    echo '<input type="color" name="vsge_pdf_secondary_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_muted_color_cb() {
    $val = get_option( 'vsge_pdf_muted_color', '#555555' );
    echo '<input type="color" name="vsge_pdf_muted_color" value="' . esc_attr( $val ) . '" />';
}

function vsge_pdf_font_family_cb() {
    $val = get_option( 'vsge_pdf_font_family', 'Poppins' );
    ?>
    <select name="vsge_pdf_font_family">
        <option value="Poppins" <?php selected( $val, 'Poppins' ); ?>>Poppins</option>
        <option value="Work Sans" <?php selected( $val, 'Work Sans' ); ?>>Work Sans</option>
        <option value="Helvetica" <?php selected( $val, 'Helvetica' ); ?>>Helvetica</option>
        <option value="Times" <?php selected( $val, 'Times' ); ?>>Times</option>
        <option value="Courier" <?php selected( $val, 'Courier' ); ?>>Courier</option>
    </select>
    <?php
}

function vsge_pdf_page_size_cb() {
    $val = get_option( 'vsge_pdf_page_size', 'A4' );
    ?>
    <select name="vsge_pdf_page_size">
        <option value="A4" <?php selected( $val, 'A4' ); ?>>A4</option>
        <option value="LETTER" <?php selected( $val, 'LETTER' ); ?>>Letter</option>
        <option value="LEGAL" <?php selected( $val, 'LEGAL' ); ?>>Legal</option>
    </select>
    <?php
}

function vsge_pdf_page_margins_cb() {
    $val = get_option( 'vsge_pdf_page_margins', '20, 40, 20, 30' );
    echo '<input type="text" name="vsge_pdf_page_margins" value="' . esc_attr( $val ) . '" placeholder="20, 40, 20, 30" />';
}

function vsge_pdf_linked_products_cb() {
    $options = get_option( 'vsge_pdf_linked_products', array( 'accessories', 'related', 'similar', 'components', 'delivery', 'package', 'brb_media_spare_parts' ) );
    if ( ! is_array( $options ) ) {
        $options = array();
    }
    
    $types = array(
        'accessories' => 'Accessories',
        'components' => 'Components',
        'delivery' => 'Delivery',
        'package' => 'Package',
        'related' => 'Related Products',
        'similar' => 'Similar Products',
        'brb_media_spare_parts' => 'Spare Parts'
    );
    
    foreach ( $types as $key => $label ) {
        $checked = in_array( $key, $options ) ? 'checked="checked"' : '';
        echo '<label><input type="checkbox" name="vsge_pdf_linked_products[]" value="' . esc_attr( $key ) . '" ' . $checked . ' /> ' . esc_html( $label ) . '</label><br>';
    }
}

function vsge_pdf_custom_logo_cb() {
    $val = get_option( 'vsge_pdf_custom_logo', '' );
    echo '<input type="text" id="vsge_pdf_custom_logo" name="vsge_pdf_custom_logo" value="' . esc_attr( $val ) . '" style="width: 300px;" />';
    echo ' <button type="button" class="button vsge_pdf_upload_logo_btn">Upload / Select Image</button>';
}

function vsge_pdf_footer_phrase_cb() {
    $val = get_option( 'vsge_pdf_footer_phrase', 'SERVING THE SHOP ® %%sep%% SINCE 1925' );
    echo '<input type="text" name="vsge_pdf_footer_phrase" value="' . esc_attr( $val ) . '" style="width: 400px;" />';
    echo '<p class="description">Use <code>%%sep%%</code> to separate the text into primary and accent colors.</p>';
}

function vsge_pdf_admin_enqueue_scripts( $hook ) {
    if ( 'settings_page_vsge_pdf_settings' !== $hook ) {
        return;
    }
    wp_enqueue_media();
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var uploadBtn = document.querySelector('.vsge_pdf_upload_logo_btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var custom_uploader = wp.media({
                    title: 'Select Custom Logo',
                    button: { text: 'Use this image' },
                    multiple: false
                });
                custom_uploader.on('select', function() {
                    var attachment = custom_uploader.state().get('selection').first().toJSON();
                    var logoInput = document.getElementById('vsge_pdf_custom_logo');
                    if (logoInput) {
                        logoInput.value = attachment.url;
                    }
                });
                custom_uploader.open();
            });
        }
    });
    </script>
    <?php
}
add_action( 'admin_enqueue_scripts', 'vsge_pdf_admin_enqueue_scripts' );

function vsge_pdf_options_page_html() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>VSGE PDF Generator Settings</h1>
        <form action="options.php" method="post">
            <?php
            settings_fields( 'vsge_pdf_options_group' );
            do_settings_sections( 'vsge_pdf_settings' );
            submit_button( 'Save Settings' );
            ?>
        </form>
    </div>
    <?php
}

// Expose settings to frontend via wp_footer action
function vsge_pdf_expose_settings() {
    $color = get_option( 'vsge_pdf_primary_color', '#C8102E' );
    $black = get_option( 'vsge_pdf_black_color', '#000000' );
    $white = get_option( 'vsge_pdf_white_color', '#FFFFFF' );
    $grey = get_option( 'vsge_pdf_grey_color', '#F3F3F3' );
    $secondary = get_option( 'vsge_pdf_secondary_color', '#FFD700' );
    $muted = get_option( 'vsge_pdf_muted_color', '#555555' );
    $font  = get_option( 'vsge_pdf_font_family', 'Poppins' );
    $size  = get_option( 'vsge_pdf_page_size', 'A4' );
    $margins = get_option( 'vsge_pdf_page_margins', '20, 40, 20, 30' );
    $products = get_option( 'vsge_pdf_linked_products', array( 'accessories', 'related', 'similar', 'components', 'delivery', 'package', 'brb_media_spare_parts' ) );
    if ( ! is_array( $products ) ) {
        $products = array();
    }
    
    $custom_logo = get_option( 'vsge_pdf_custom_logo', '' );
    if ( empty( $custom_logo ) ) {
        $custom_logo = get_site_icon_url();
    }
    $footer_phrase = get_option( 'vsge_pdf_footer_phrase', 'SERVING THE SHOP ® %%sep%% SINCE 1925' );
    
    // pluginUrl should point to the root plugin directory
    // dirname(__DIR__) is the root since we are in inc/
    $pluginUrl = plugin_dir_url( dirname( __DIR__ ) . '/vsge-woo-product-to-pdf.php' );

    $labels = array(
        'description'       => __( 'DESCRIPTION', 'vsge-woo-product-to-pdf' ),
        'technical_details' => __( 'TECHNICAL DETAILS', 'vsge-woo-product-to-pdf' ),
        'accessories'       => __( 'ACCESSORIES', 'vsge-woo-product-to-pdf' ),
        'components'        => __( 'COMPONENTS', 'vsge-woo-product-to-pdf' ),
        'delivery'          => __( 'DELIVERY', 'vsge-woo-product-to-pdf' ),
        'package'           => __( 'PACKAGE', 'vsge-woo-product-to-pdf' ),
        'related'           => __( 'RELATED PRODUCTS', 'vsge-woo-product-to-pdf' ),
        'similar'           => __( 'SIMILAR PRODUCTS', 'vsge-woo-product-to-pdf' ),
        'spare_parts'       => __( 'SPARE PARTS', 'vsge-woo-product-to-pdf' ),
    );

    $current_lang = '';
    if ( function_exists( 'pll_current_language' ) ) {
        $current_lang = pll_current_language( 'slug' );
    }

    $settings = array(
        'primaryColor'   => $color,
        'blackColor'     => $black,
        'whiteColor'     => $white,
        'greyColor'      => $grey,
        'secondaryColor' => $secondary,
        'mutedColor'     => $muted,
        'fontFamily'     => $font,
        'pageSize'       => $size,
        'pageMargins'    => $margins,
        'linkedProducts' => $products,
        'pluginUrl'      => $pluginUrl,
        'customLogo'     => $custom_logo,
        'footerPhrase'   => $footer_phrase,
        'labels'         => $labels,
        'currentLanguage'=> $current_lang,
    );
    echo "<script>window.VSGE_PDF_Settings = " . wp_json_encode( $settings ) . ";</script>";
}
add_action( 'wp_footer', 'vsge_pdf_expose_settings', 10 );
