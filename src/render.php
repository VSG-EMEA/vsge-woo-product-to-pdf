<?php
// src/render.php
global $post;
$post_type = get_post_type($post);
?>

<a
    href="javascript:void(0);"
    class="wp-block-vsge-save-pdf-button"
    title="<?php echo esc_attr($attributes['title'] ?? 'Download PDF'); ?>"
    data-post-id="<?php echo esc_attr($post->ID); ?>"
    data-post-type="<?php echo esc_attr($post_type); ?>"
    <?php echo get_block_wrapper_attributes(); ?>
>
    <?php echo wp_kses_post($attributes['icon'] ?? 'PDF'); ?>
</a>
