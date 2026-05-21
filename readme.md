# VSGE WooCommerce Product to PDF

A modern, high-performance WordPress block plugin developed by **Codekraft Studio** that allows frontend rendering and downloading of WooCommerce products and pages as highly optimized PDF files using `pdfMake`. 

This plugin is tailored for our internal workflows and integrates deeply with custom fields and specific product metadata structures within our store architecture.

---

## 🛠 Features & Architecture

- **Gutenberg Native:** Fully built using standard WordPress block specifications compatible with WordPress 6.5+.
- **Frontend PDF Rendering:** Generates documents directly in the browser via `pdfMake`, offloading server CPU and ensuring immediate responses.
- **Optimized Assets:** Restricts dynamic rendering payloads (like component and accessory imagery) to `thumbnail` dimensions, keeping generated document sizes extremely compact.
- **Fully Localized:** Implements native client-side internationalization utilizing `@wordpress/i18n` combined with server-driven translation textdomain mappings (`wp_set_script_translations`).

---

## 📋 Requirements

- **WordPress:** 6.5+
- **WooCommerce:** 8.0+
- **Node.js:** For asset compilation (`npm run build`)

---

## 🚀 Installation & Development

1. Clone the repository into your WordPress plugins directory:
   ```bash
   git clone [https://github.com/vsg-emea/vsge-woo-product-to-pdf.git](https://github.com/vsg-emea/vsge-woo-product-to-pdf.git)

```

2. Navigate to the plugin folder and install the dependencies:
```bash
cd vsge-woo-product-to-pdf
npm install

```


3. Compile production assets or run the development server:
```bash
# Production build
npm run build

# Development mode with hot-reloading
npm run start

```



---

## 💬 Internationalization (i18n)

This plugin completely adheres to native WordPress standards. Frontend strings are wrapped inside the `__( 'String', 'vsge-woo-product-to-pdf' )` JavaScript execution context.

To update or build translation templates, you can parse the source elements inside `src/` using a standard translation wrapper extractor tool (e.g., your customized JS-based `makepot` pipeline) and compile `.json` translation mappings into the root `/languages` directory.

---

## 🏛 Open Source & Internal Notice

> [!NOTE]
> This plugin was originally designed as an **internal tool** explicitly mapped to our specific WooCommerce custom fields setups, custom metadata configurations, and layout grids.

### Disclaimer & License

While this repository is tailored for our private business environments, **any developer or organization is free to clone, fork, modify, redistribute, and customize** this codebase to adapt it to their own WooCommerce properties and metadata architectures.

This project is licensed under the **GPLv2 or later** (or standard WordPress Open Source guidelines). It is provided *as-is*, without warranties of any kind regarding specific external production suitability. Feel free to shape it to your needs!
