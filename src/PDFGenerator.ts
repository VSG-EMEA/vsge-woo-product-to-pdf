import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import { __ } from '@wordpress/i18n';
import {
	TDocumentDefinitions,
	Content,
	StyleDictionary,
} from 'pdfmake/interfaces';

// Register default fonts
( pdfMake as any ).vfs = pdfFonts.vfs;

export class PDFGenerator {
	private data: any;
	private type: string;
	private settings: any;
	private styles: StyleDictionary;

	/** @return {string} The primary red color from settings or a default fallback. */
	private get C_RED(): string {
		return this.settings.primaryColor || '#c8102e';
	}

	/** @return {string} The primary black color from settings or a default fallback. */
	private get C_BLACK(): string {
		return this.settings.blackColor || '#000';
	}

	/** @return {string} The primary white color from settings or a default fallback. */
	private get C_WHITE(): string {
		return this.settings.whiteColor || '#fff';
	}

	/** @return {string} A very light grey used primarily for the hero background. */
	private get C_GREY_LIGHT(): string {
		return '#f4f4f4';
	}

	/** @return {string} A standard grey used for section headers. */
	private get C_GREY_SECTION(): string {
		return '#f3f3f3';
	}

	/** @return {string} The secondary accent color from settings or a default fallback. */
	private get C_SECONDARY(): string {
		return this.settings.secondaryColor || '#ffd700';
	}

	/** @return {string} The muted text color from settings or a default fallback. */
	private get C_MUTED(): string {
		return this.settings.mutedColor || '#555';
	}

	/** Resolved product/page title, stored so the document header can access it globally. */
	private documentTitle = '';

	/** Preloaded company logo as a base64 data-URI (may be null). */
	private logoBase64: string | null = null;

	/** Total page width for standard A4 format (in points). Used to calculate true full-width layouts. */
	private readonly PAGE_WIDTH_A4 = 595.28;

	/** Page padding (margins). MUST match pageMargins[0] and [2] in the document definition. */
	private readonly SIDE_MARGIN = 40;

	/** Content area width calculated as A4 Width minus (2 * Side Margin). */
	private readonly CONTENT_WIDTH = this.PAGE_WIDTH_A4 - 2 * this.SIDE_MARGIN;

	/**
	 * Initializes the PDF generator.
	 *
	 * @param {any} data - The raw data object used to populate the PDF content.
	 * @param {string} type - The type of document to generate (e.g., 'product', 'page').
	 * @param {any} [settings] - Optional configuration settings for styling and layout.
	 */
	constructor( data: any, type: string, settings?: any ) {
		this.data = data;
		this.type = type;
		// Use provided settings or fall back to global settings
		this.settings =
			settings ||
			( typeof window !== 'undefined' &&
				( window as any ).VSGE_PDF_Settings ) ||
			{};

		this.styles = {
			// ── Typography ──────────────────────────────────────────────────
			h1: {
				fontSize: 18,
				bold: true,
				color: this.C_BLACK,
				margin: [ 0, 0, 0, 6 ],
			},
			/** Used inside HTML-parsed content (red sub-headings). */
			h2: {
				fontSize: 11,
				bold: true,
				color: this.C_RED,
				margin: [ 0, 10, 0, 4 ],
			},
			h3: {
				fontSize: 10,
				bold: true,
				color: this.C_RED,
				margin: [ 0, 6, 0, 2 ],
			},
			normal: {
				fontSize: 9,
				lineHeight: 1.35,
				color: this.C_BLACK,
			},
			sku: {
				fontSize: 10,
				bold: true,
				color: this.C_BLACK,
				margin: [ 0, 0, 0, 6 ],
			},
			tableHeader: {
				bold: true,
				fontSize: 9,
				color: this.C_BLACK,
			},
			footerText: {
				fontSize: 8,
				color: this.C_WHITE,
			},
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * PUBLIC ENTRY POINT
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Orchestrates font loading, logo processing, document generation, and triggers the PDF download.
	 *
	 * @return {Promise<void>} A promise that resolves when the PDF generation and download process is complete.
	 */
	public async processAndDownload(): Promise< void > {
		await this.loadFontsToVfs();

		// Get the website logo and process it
		const logoUrl: string | undefined =
			this.settings.customLogo || this.data.page_logo_src || undefined;
		this.logoBase64 = logoUrl ? await this.imageToBase64( logoUrl ) : null;

		const docDefinition = await this.buildDocument();
		const filename = `${ this.data.slug || 'download' }.pdf`;

		( pdfMake as any )
			.createPdf(
				docDefinition,
				{},
				pdfMake.fonts,
				( pdfMake as any ).vfs
			)
			.download( filename );
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * FONT LOADING
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Fetches custom fonts specified in settings and registers them to the pdfMake Virtual File System (VFS).
	 *
	 * @return {Promise<void>} A promise that resolves when custom font assets have been successfully loaded.
	 */
	private async loadFontsToVfs(): Promise< void > {
		const family = this.settings.fontFamily;
		if ( family === 'Poppins' || family === 'Work Sans' ) {
			const isWorkSans = family === 'Work Sans';
			const folder = isWorkSans ? 'Work_Sans' : 'Poppins';
			const prefix = isWorkSans ? 'WorkSans' : 'Poppins';
			const assetsPath = `${ this.settings.pluginUrl }assets/${ folder }/`;

			const fontData = [
				{
					name: 'normal',
					filename: isWorkSans
						? 'WorkSans-Regular.ttf'
						: 'Poppins-Light.ttf',
				},
				{ name: 'bold', filename: `${ prefix }-Bold.ttf` },
				{ name: 'italics', filename: `${ prefix }-Italic.ttf` },
				{ name: 'bolditalics', filename: `${ prefix }-BoldItalic.ttf` },
			];

			pdfMake.fonts = pdfMake.fonts || {};
			pdfMake.fonts[ family ] = Object.fromEntries(
				fontData.map( ( v ) => [ v.name, assetsPath + v.filename ] )
			);

			const vfs: Record< string, string > = ( pdfMake as any ).vfs || {};
			( pdfMake as any ).vfs = vfs;

			for ( const v of fontData ) {
				const fullKey = assetsPath + v.filename;
				if ( ! vfs[ fullKey ] ) {
					try {
						const response = await fetch( fullKey );
						if ( response.ok ) {
							vfs[ fullKey ] = this.arrayBufferToBase64(
								await response.arrayBuffer()
							);
						}
					} catch ( e ) {
						/* eslint-disable no-console */
						console.error(
							`[PDF] Font fetch error: ${ fullKey }`,
							e
						);
						/* eslint-enable no-console */
					}
				}
			}
		}
	}

	/**
	 * Converts an ArrayBuffer to a base64 encoded string.
	 *
	 * @param {ArrayBuffer} buffer - The raw buffer data to convert.
	 * @return {string} The base64 encoded representation of the buffer.
	 */
	private arrayBufferToBase64( buffer: ArrayBuffer ): string {
		const bytes = new Uint8Array( buffer );
		let binary = '';
		for ( let i = 0; i < bytes.byteLength; i++ ) {
			binary += String.fromCharCode( bytes[ i ] );
		}
		return window.btoa( binary );
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * DOCUMENT BUILDER
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Constructs the core document definition required by pdfMake.
	 * Configures pagination, layout margins, native backgrounds, headers, footers, and content body.
	 *
	 * @return {Promise<TDocumentDefinitions>} A promise resolving to the pdfMake document definition object.
	 */
	private async buildDocument(): Promise< TDocumentDefinitions > {
		this.documentTitle = this.decodeHtmlEntities(
			this.type === 'product'
				? this.data.name || 'Product'
				: this.data.title?.rendered || 'Document'
		);

		const categoryLabel = this.decodeHtmlEntities(
			this.data.categories?.[ 0 ]?.name || ''
		).toUpperCase();

		const pageSize = 'A4';
		// Exact margins: 115 top, 60 bottom to accommodate headers and footers without clipping main content.
		const pageMargins: [ number, number, number, number ] = [
			this.SIDE_MARGIN,
			115,
			this.SIDE_MARGIN,
			60,
		];

		return {
			pageSize,
			pageMargins,
			// NATIVE BACKGROUND: Draws fixed rectangles behind everything, without affecting the text spacing.
			background: ( _currentPage: number, size: any ) => {
				return {
					canvas: [
						// Header: Red band (0-48px), White line (48-50px), Black band (50-85px)
						{
							type: 'rect',
							x: 0,
							y: 0,
							w: size.width,
							h: 48,
							color: this.C_RED,
						},
						{
							type: 'rect',
							x: 0,
							y: 48,
							w: size.width,
							h: 30,
							color: this.C_BLACK,
						},
						// Footer: Black band pinned exactly to the bottom (height 60px)
						{
							type: 'rect',
							x: 0,
							y: size.height - 60,
							w: size.width,
							h: 60,
							color: this.C_BLACK,
						},
					],
				};
			},
			header: ( currentPage: number, pageCount: number ): Content =>
				this.buildHeader( currentPage, pageCount, categoryLabel ),
			footer: (): Content => this.buildFooter(),
			content:
				this.type === 'product'
					? await this.buildProductContent()
					: this.buildPageContent(),
			styles: this.styles,
			defaultStyle: {
				fontSize: 9,
				font: this.settings.fontFamily || 'Roboto',
				color: this.C_BLACK,
			},
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * HEADER
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Builds the repeating document header containing the logo, category label, document title, and page pagination.
	 *
	 * @param {number} currentPage - The current active page number.
	 * @param {number} pageCount - The total number of pages in the document.
	 * @param {string} categoryLabel - The formatted product or page category label.
	 * @return {Content} The pdfMake content object representing the header.
	 */
	private buildHeader(
		currentPage: number,
		pageCount: number,
		categoryLabel: string
	): Content {
		const m = this.SIDE_MARGIN; // 40px
		const logoStack = this.buildLogoContent( this.C_WHITE, undefined, 40 );

		return {
			// 40px left/right, 12px top. The text fits cleanly within the background bands.
			margin: [ m, 4, m, 0 ],
			stack: [
				// Red band content
				{
					columns: [
						{ width: 'auto', stack: [ logoStack ] },
						{
							width: '*',
							text: categoryLabel,
							bold: true,
							fontSize: 14,
							color: this.C_WHITE,
							alignment: 'right',
							margin: [ 0, 12, 0, 0 ],
						},
					],
				},
				// Black band content
				{
					// Pushes the text down exactly into the black band area.
					margin: [ 0, 12, 0, 0 ],
					columns: [
						{
							width: '*',
							text: this.documentTitle,
							bold: true,
							fontSize: 10,
							color: this.C_WHITE,
						},
						{
							width: 'auto',
							text: `${ currentPage } / ${ pageCount }`,
							fontSize: 9,
							color: this.C_WHITE,
							alignment: 'right',
						},
					],
				},
			],
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * FOOTER
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Builds the repeating document footer containing the logo and static copyright taglines.
	 *
	 * @return {Content} The pdfMake content object representing the footer layout.
	 */
	private buildFooter(): Content {
		const m = this.SIDE_MARGIN; // 40px
		const logoStack = this.buildLogoContent( this.C_WHITE, undefined, 40 );

		const phrase = this.settings.footerPhrase || '';
		const parts = phrase.split( '%%sep%%' );
		const textContent: any[] = [];

		if ( parts.length > 1 ) {
			textContent.push( {
				text: parts[ 0 ],
				bold: true,
				fontSize: 9,
				color: this.C_WHITE,
			} );
			textContent.push( {
				text: parts[ 1 ],
				bold: true,
				fontSize: 9,
				color: this.C_SECONDARY,
			} );
		} else {
			textContent.push( {
				text: phrase,
				bold: true,
				fontSize: 9,
				color: this.C_WHITE,
			} );
		}

		return {
			// The footer starts automatically at "page bottom - 60px" height.
			// We add 40px lateral margins and 20px top margin to center the text in the black box.
			margin: [ m, 12, m, 0 ],
			columns: [
				{ width: 'auto', stack: [ logoStack ] },
				{ width: '*', text: '' },
				{
					width: 'auto',
					text: textContent,
					alignment: 'right',
					margin: [ 0, 12, 0, 0 ],
				},
			],
		};
	}

	/**
	 * Generates the content object for the document logo, falling back to a text-based site name if the image is unavailable.
	 *
	 * @param {string} textColor - The hex color code to apply if defaulting to the fallback text.
	 * @param {number} [imageWidth] - Optional width constraint for the rendered logo image.
	 * @param {number} [imageHeight] - Optional height constraint for the rendered logo image.
	 * @return {Content} The pdfMake content object representing the logo or site name fallback.
	 */
	private buildLogoContent(
		textColor: string,
		imageWidth?: number,
		imageHeight?: number
	): Content {
		if ( this.logoBase64 ) {
			return {
				image: this.logoBase64,
				width: imageWidth,
				height: imageHeight,
				alignment: 'left',
			};
		}

		const fallbackName = this.settings.siteName || '';
		return {
			text: fallbackName,
			bold: true,
			fontSize: 14,
			color: textColor,
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * SECTION TITLE HELPER
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Creates a standardized and styled section title block.
	 *
	 * @param {string} label - The text label to display within the section title block.
	 * @param {'before' | 'after'} [pageBreak] - Optional directive to force a page break 'before' or 'after' this section.
	 * @param {string} [id] - Optional unique identifier used for internal document linking.
	 * @return {Content} The pdfMake content object representing the formatted section title.
	 */
	private sectionTitle(
		label: string,
		pageBreak?: 'before' | 'after',
		id?: string
	): Content {
		const block: any = {
			table: {
				widths: [ '*' ],
				body: [
					[
						{
							text: label,
							bold: true,
							fontSize: 11,
							color: this.C_BLACK,
							fillColor: this.C_GREY_SECTION,
							margin: [ 10, 7, 10, 7 ],
							border: [ false, false, false, false ],
						},
					],
				],
			},
			layout: 'noBorders',
			margin: [ 0, 12, 0, 10 ] as [ number, number, number, number ],
		};
		if ( pageBreak ) {
			block.pageBreak = pageBreak;
		}
		if ( id ) {
			block.id = id;
		}
		return block;
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * PAGE CONTENT  (standard WP pages – non-product)
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Assembles the primary content layout structure for standard informational pages (non-product entities).
	 *
	 * @return {Content[]} An array of pdfMake content objects forming the core page layout.
	 */
	private buildPageContent(): Content[] {
		return [
			{ text: this.data.title?.rendered || 'Document', style: 'h1' },
			this.parseHtml( this.data.content?.rendered || '' ),
		];
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * PRODUCT CONTENT
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Constructs the detailed, structured content layout specific to product catalogs,
	 * integrating hero sections, technical drawings, linked products grids, and spec tables.
	 *
	 * @return {Promise<Content[]>} A promise resolving to an array of pdfMake content objects detailing the product layout.
	 */
	private async buildProductContent(): Promise< Content[] > {
		const content: Content[] = [];

		const imageUrl: string | undefined = this.data.images?.[ 0 ]?.src;
		const imageBase64 = imageUrl
			? await this.imageToBase64( imageUrl )
			: null;

		const imageCell: Content = imageBase64
			? { image: imageBase64, width: 210, alignment: 'center' }
			: {
					canvas: [
						{
							type: 'rect',
							x: 0,
							y: 0,
							w: 210,
							h: 180,
							color: '#fff',
						},
					],
			  };

		// Extract core meta values for the hero section
		const otherMeta = [
			{ key: '_gtin', label: 'GTIN' },
			{ key: 'sku', label: 'SKU' },
		];
		const metaTexts: Content[] = [];
		for ( const { key, label } of otherMeta ) {
			const value = this.getMetaValue( key );
			if (
				value &&
				typeof value !== 'object' &&
				String( value ) !== '0' &&
				String( value ) !== ''
			) {
				metaTexts.push( {
					text: `${ label }: ${ String( value ) }`,
					fontSize: 9,
					margin: [ 0, 0, 0, 4 ],
				} );
			}
		}

		/* ── 1. Hero Area ──────────────────────────────────────────────── */
		content.push( {
			margin: [ 0, 0, 0, 30 ],
			columns: [
				{
					width: '45%',
					stack: [ imageCell ],
					alignment: 'center',
					margin: [ 0, 10, 10, 0 ],
				},
				{
					width: '55%',
					table: {
						widths: [ '*' ],
						body: [
							[
								{
									fillColor: this.C_GREY_LIGHT,
									border: [ false, false, false, false ],
									stack: [
										{
											text: `${
												this.decodeHtmlEntities(
													this.data.name
												) || 'N/A'
											}`,
											style: 'h1',
											margin: [ 0, 0, 0, 0 ],
										},
										{
											canvas: [
												{
													type: 'line',
													x1: 0,
													y1: 0,
													x2: 120,
													y2: 0,
													lineWidth: 1.5,
													lineColor: this.C_RED,
												},
											],
											margin: [ 0, 0, 0, 12 ],
										},
										...metaTexts,
										{ text: '', margin: [ 0, 2, 0, 4 ] },
										this.parseHtml(
											this.data.short_description || ''
										),
									],
								},
							],
						],
					},
					layout: {
						defaultBorder: false,
						paddingLeft: () => 20,
						paddingRight: () => 20,
						paddingTop: () => 20,
						paddingBottom: () => 20,
					},
				},
			],
		} );

		/* ── 2. Description Section (Exact and Balanced Columns) ─────── */

		content.push( {
			canvas: [
				{
					type: 'line',
					x1: 0,
					y1: 0,
					x2: this.CONTENT_WIDTH,
					y2: 0,
					lineWidth: 1.5,
					lineColor: this.C_RED,
				},
			],
			margin: [ 0, 0, 0, 15 ],
		} );

		content.push( {
			text: __( 'DESCRIPTION', 'vsge-woo-product-to-pdf' ),
			bold: true,
			fontSize: 12,
			color: this.C_BLACK,
			margin: [ 0, 0, 0, 4 ],
		} );

		const subtitle = this.getMetaValue( 'product_subtitle' );
		if ( subtitle ) {
			content.push( {
				text: subtitle,
				bold: true,
				fontSize: 10,
				color: this.C_RED,
				margin: [ 0, 0, 0, 15 ],
			} );
		}

		// Render description as a single full-width column — plain and reliable.
		const rawDesc = this.data.description || '';
		content.push( {
			stack: [ this.parseHtml( rawDesc ) ],
			margin: [ 0, 10, 0, 0 ],
		} as any );

		/* ── 3. Technical Drawings ─────────────────────────────────────────── */
		/**
		 * Render technical drawings section.
		 * drawingRaw is an array of { id, url, title, thumbnail, description }.
		 * We use the 'url' property which has been optimized to 'medium' size (approx 300px)
		 * in the REST API to balance quality and PDF file size.
		 */
		const drawingRaw = this.getMetaValue( 'brb_media_drawing' );

		if ( Array.isArray( drawingRaw ) && drawingRaw.length > 0 ) {
			const imageEntries: any[] = drawingRaw.filter( ( entry: any ) => {
				const url: string = ( entry?.url || '' ).toLowerCase();
				return /\.(jpe?g|png|gif|webp|svg)$/.test( url );
			} );

			if ( imageEntries.length > 0 ) {
				const drawingDataUris: string[] = [];

				for ( const entry of imageEntries ) {
					// Use entry.url (optimized to medium size in PHP)
					const dataUri = await this.imageToBase64( entry.url );
					if ( dataUri ) {
						drawingDataUris.push( dataUri );
					} else {
						/* eslint-disable no-console */
						console.warn(
							`[PDF] Technical Drawing — imageToBase64 failed for: ${ entry.url }`
						);
					}
				}

				if ( drawingDataUris.length > 0 ) {
					for ( const dataUri of drawingDataUris ) {
						content.push( {
							image: dataUri,
							width: 250,
							alignment: 'left',
							margin: [ 0, 0, 0, 16 ],
						} );
					}
				}
			}
		}

		/* ── 4. Linked products / spare parts (2-column grid) ────────────── */
		const allLinkedProducts = [
			{
				key: 'accessories',
				label: __( 'ACCESSORIES', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'components',
				label: __( 'COMPONENTS', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'delivery',
				label: __( 'DELIVERY', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'package',
				label: __( 'PACKAGE', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'related',
				label: __( 'RELATED PRODUCTS', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'similar',
				label: __( 'SIMILAR PRODUCTS', 'vsge-woo-product-to-pdf' ),
			},
			{
				key: 'brb_media_spare_parts',
				label: __( 'SPARE PARTS', 'vsge-woo-product-to-pdf' ),
			},
		];

		const enabledTypes = this.settings.linkedProducts;
		const linkedProducts =
			enabledTypes && Array.isArray( enabledTypes )
				? allLinkedProducts.filter( ( p ) =>
						enabledTypes.includes( p.key )
				  )
				: allLinkedProducts.filter( ( p ) => p.key !== 'related' );

		let firstLinkedProduct = true;
		for ( const { key, label } of linkedProducts ) {
			const value =
				this.getMetaValue( key ) ||
				this.getMetaValue( `_${ key }_ids` );
			if ( value && Array.isArray( value ) && value.length > 0 ) {
				if ( firstLinkedProduct ) {
					// Page break after description, before the first linked-product section.
					content.push( { text: '', pageBreak: 'before' } as any );
					firstLinkedProduct = false;
				}
				content.push( await this.buildGridLayout( value, label ) );
			}
		}

		/* ── 5. Technical details table (page-break before) ─────────────── */
		const attributes = this.data.product_attributes_translated?.length
			? this.data.product_attributes_translated
			: this.data.attributes;

		if (
			attributes &&
			Array.isArray( attributes ) &&
			attributes.length > 0
		) {
			content.push(
				this.sectionTitle(
					__( 'TECHNICAL DETAILS', 'vsge-woo-product-to-pdf' ),
					'before'
				)
			);
			content.push( this.buildAttributesTable( attributes ) );
		}

		return content;
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * ATTRIBUTES TABLE
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Constructs a styled, two-column table displaying technical product attributes.
	 *
	 * @param {any[]} attributes - An array of attribute objects containing names and associated options.
	 * @return {Content} The pdfMake content object representing the attributes table.
	 */
	private buildAttributesTable( attributes: any[] ): Content {
		const dataRows: any[][] = attributes.map( ( attr, idx ) => {
			const values = Array.isArray( attr.options )
				? attr.options
						.map( ( opt: string ) =>
							this.decodeHtmlEntities( opt )
						)
						.join( ', ' )
				: this.decodeHtmlEntities( String( attr.options ?? '' ) );
			const fillColor = idx % 2 === 0 ? '#fff' : '#F3F3F3';
			return [
				{
					text: this.decodeHtmlEntities( attr.name ),
					bold: true,
					fontSize: 9,
					margin: [ 6, 5, 6, 5 ],
					fillColor,
				},
				{
					text: values,
					fontSize: 9,
					margin: [ 6, 5, 6, 5 ],
					fillColor,
				},
			];
		} );

		return {
			table: {
				headerRows: 0,
				widths: [ '30%', '70%' ],
				body: dataRows,
			},
			layout: {
				defaultBorder: false,
				hLineWidth: ( i: number ) => {
					if ( i === 0 ) {
						return 0;
					}
					if ( i === 1 ) {
						return 2;
					}
					return 0.5;
				},
				hLineColor: ( i: number ) =>
					i === 1 ? this.C_RED : '#e8e8e8',
				vLineWidth: () => 0,
			},
			margin: [ 0, 0, 0, 20 ],
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * GRID LAYOUT
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Dynamically generates a structured, two-column grid layout for listing related items, accessories, or spare parts.
	 *
	 * @param {any[]} items - An array of product/item data objects to populate the grid.
	 * @param {string} [sectionLabel] - Optional heading label to display spanning across the grid top.
	 * @return {Promise<Content>} A promise resolving to the pdfMake content object representing the compiled grid.
	 */
	private async buildGridLayout(
		items: any[],
		sectionLabel?: string
	): Promise< Content > {
		if ( ! items?.length ) {
			return { text: '' };
		}

		// Row 0 (when sectionLabel is provided): full-width grey section title.
		// Subsequent rows: one item pair per row with alternating backgrounds.
		// dontBreakRows: true ensures no row is ever split across pages, and
		// because the title is row 0 of the same table it always stays with the content.
		const body: any[][] = [];

		if ( sectionLabel ) {
			body.push( [
				{
					text: sectionLabel,
					bold: true,
					fontSize: 11,
					color: this.C_BLACK,
					fillColor: this.C_GREY_SECTION,
					colSpan: 2,
					margin: [ 10, 7, 10, 7 ],
					border: [ false, false, false, false ],
				},
				// Second cell is required by pdfmake when colSpan is used
				{ text: '', border: [ false, false, false, false ] },
			] );
		}

		for ( let i = 0; i < items.length; i += 2 ) {
			const col1 = await this.buildGridItem( items[ i ] );
			const col2 = items[ i + 1 ]
				? await this.buildGridItem( items[ i + 1 ] )
				: { text: '' };

			body.push( [
				{
					stack: [ col1 ],
					border: [ false, false, false, false ],
					margin: [ 0, 0, 4, 6 ],
				},
				{
					stack: [ col2 ],
					border: [ false, false, false, false ],
					margin: [ 4, 0, 0, 6 ],
				},
			] );
		}

		return {
			table: {
				widths: [ '50%', '50%' ],
				dontBreakRows: true,
				// keepWithHeaderRows keeps the title row (row 0) on the same page
				// as the first data row so they are never separated.
				headerRows: sectionLabel ? 1 : 0,
				keepWithHeaderRows: sectionLabel ? 1 : 0,
				body,
			},
			layout: 'noBorders',
			margin: [ 0, 12, 0, 16 ],
		};
	}

	/**
	 * Constructs the internal layout and content for a singular item block within a grid cell.
	 * Optimized to use 'thumbnail' image size (150x150) for the 50x50 grid display,
	 * ensuring high quality on high-DPI displays while keeping the PDF file size small.
	 *
	 * @param {any} item - The individual item data object (containing name, thumbnail, mpn, etc.).
	 * @return {Promise<Content>} A promise resolving to the pdfMake content object representing the grid item.
	 */
	private async buildGridItem( item: any ): Promise< Content > {
		const title = this.decodeHtmlEntities(
			item.name || item.title || String( item.id ?? item )
		);
		const mpn = this.decodeHtmlEntities( item.mpn || '' );
		const desc = this.decodeHtmlEntities( item.description || '' );

		let imageBase64: string | null = null;
		if ( item.thumbnail ) {
			// item.thumbnail is already optimized to 'thumbnail' size (usually 150x150) in PHP
			imageBase64 = await this.imageToBase64( item.thumbnail );
		} else if ( item.url && /\.(png|jpe?g)$/i.test( item.url ) ) {
			// Fallback to url if thumbnail is missing
			imageBase64 = await this.imageToBase64( item.url );
		}

		const imageContent: Content = imageBase64
			? { image: imageBase64, fit: [ 50, 50 ], alignment: 'center' }
			: {
					canvas: [
						{
							type: 'rect',
							x: 0,
							y: 0,
							w: 50,
							h: 50,
							color: '#e8e8e8',
						},
					],
			  };

		const titleContent: Content = item.url
			? {
					text: title,
					bold: true,
					fontSize: 9,
					color: this.C_BLACK,
					link: item.url,
			  }
			: { text: title, bold: true, fontSize: 9, color: this.C_BLACK };

		return {
			table: {
				widths: [ 60, '*' ],
				body: [
					[
						{
							stack: [ imageContent ],
							fillColor: '#f8f8f8',
							margin: [ 5, 5, 5, 5 ],
							border: [ false, false, false, false ],
						},
						{
							stack: [
								titleContent,
								{
									text: mpn,
									fontSize: 7,
									color: this.C_BLACK,
									margin: [ 0, 2, 0, 0 ],
								},
								{
									text: desc,
									fontSize: 8,
									color: this.C_MUTED,
									margin: [ 0, 3, 0, 0 ],
								},
							],
							border: [ false, false, false, false ],
							margin: [ 8, 5, 0, 5 ],
						},
					],
				],
			},
			layout: {
				defaultBorder: false,
				hLineWidth: ( i: number, node: any ) =>
					i === node.table.body.length ? 0.5 : 0,
				hLineColor: () => '#e0e0e0',
				vLineWidth: () => 0,
			},
		};
	}

	/* ════════════════════════════════════════════════════════════════════════
	 * UTILITIES
	 * ════════════════════════════════════════════════════════════════════════ */

	/**
	 * Converts raw SVG markup text into a base64 encoded PNG representation using HTML Canvas.
	 *
	 * @param {string} svgText - The raw SVG string payload to convert.
	 * @return {Promise<string | null>} A promise resolving to a base64 PNG data URL, or null if parsing/drawing fails.
	 */
	private async svgToPng( svgText: string ): Promise< string | null > {
		try {
			// Create a blob from the SVG text
			const svgBlob = new Blob( [ svgText ], {
				type: 'image/svg+xml;charset=utf-8',
			} );
			const svgUrl = URL.createObjectURL( svgBlob );

			// Create an image element to load the SVG
			const img = new Image();

			return new Promise< string | null >( ( resolve ) => {
				img.onload = () => {
					try {
						// Create a canvas with the SVG dimensions
						const canvas = document.createElement( 'canvas' );
						const ctx = canvas.getContext( '2d' );

						if ( ! ctx ) {
							URL.revokeObjectURL( svgUrl );
							resolve( null );
							return;
						}

						// Set canvas size - use a reasonable default if SVG has no intrinsic size
						const width = img.naturalWidth || 300;
						const height = img.naturalHeight || 300;
						canvas.width = width;
						canvas.height = height;

						// Draw the SVG on the canvas
						ctx.drawImage( img, 0, 0, width, height );

						// Convert to PNG data URL
						const pngDataUrl = canvas.toDataURL( 'image/png' );

						// Clean up
						URL.revokeObjectURL( svgUrl );
						resolve( pngDataUrl );
					} catch ( error ) {
						URL.revokeObjectURL( svgUrl );
						resolve( null );
					}
				};

				img.onerror = () => {
					URL.revokeObjectURL( svgUrl );
					resolve( null );
				};

				// Start loading the SVG
				img.src = svgUrl;
			} );
		} catch {
			return null;
		}
	}

	/**
	 * Fetches an image URL over the network and encodes the blob response into a base64 string.
	 * Automatically identifies and handles conversion for SVG inputs.
	 *
	 * @param {string} url - The absolute or relative URL to the target image.
	 * @return {Promise<string | null>} A promise resolving to a base64 data URL, or null if the fetch or encoding errors out.
	 */
	private async imageToBase64( url: string ): Promise< string | null > {
		try {
			// Check if the URL points to an SVG file
			const isSvg = /\.svg$/i.test( url );

			const response = await fetch( url, {
				headers: {
					Accept: isSvg
						? 'image/svg+xml,*/*;q=0.8'
						: 'image/png,image/jpeg,image/gif,*/*;q=0.8',
				},
			} );
			if ( ! response.ok ) {
				return null;
			}

			if ( isSvg ) {
				// Handle SVG files by converting to PNG
				const svgText = await response.text();
				if ( ! svgText.trim() ) {
					return null;
				}

				// Convert SVG to PNG using Canvas API
				return await this.svgToPng( svgText );
			}
			// Handle raster images as before
			const blob = await response.blob();
			if ( ! blob.type.startsWith( 'image/' ) ) {
				return null;
			}
			return new Promise< string >( ( resolve, reject ) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve( reader.result as string );
				reader.onerror = reject;
				reader.readAsDataURL( blob );
			} );
		} catch {
			return null;
		}
	}

	/**
	 * Extracts a specified metadata property from the main object footprint or within its nested `meta_data` array.
	 *
	 * @param {string} key - The metadata dictionary key to resolve.
	 * @return {any | null} The associated value for the given key, or null if absent.
	 */
	private getMetaValue( key: string ) {
		if ( this.data[ key ] !== undefined ) {
			return this.data[ key ];
		}
		if ( ! this.data.meta_data ) {
			return null;
		}
		const meta = this.data.meta_data.find( ( m: any ) => m.key === key );
		return meta ? meta.value : null;
	}

	/**
	 * Parses standard HTML string blocks and applies custom node mappings to render pdfMake compliant content dictionaries.
	 *
	 * @param {string} html - The unparsed HTML markup string.
	 * @return {Content} The mapped pdfMake content block representing the styled HTML markup.
	 */
	private parseHtml( html: string ): Content {
		if ( ! html ) {
			return { text: '' };
		}
		return htmlToPdfmake( html, {
			window: window as any,
			defaultStyles: {
				p: {
					fontSize: 9,
					lineHeight: 1.2,
					color: this.C_BLACK,
					margin: [ 0, 0, 0, 8 ],
				},
				b: { bold: true },
				strong: { bold: true, color: this.C_RED },
				i: { italics: true },
				em: { italics: true },
				u: { decoration: 'underline' },
				h1: {
					fontSize: 16,
					bold: true,
					color: this.C_BLACK,
					margin: [ 0, 0, 0, 6 ],
				},
				h2: {
					fontSize: 11,
					bold: true,
					color: this.C_RED,
					margin: [ 0, 10, 0, 4 ],
				},
				h3: {
					fontSize: 10,
					bold: true,
					color: this.C_RED,
					margin: [ 0, 6, 0, 2 ],
				},
				ul: { margin: [ 0, 4, 0, 8 ], markerColor: this.C_RED },
				li: { margin: [ 0, 0, 0, 4 ], lineHeight: 1.2 },
			},
		} ) as Content;
	}

	/**
	 * Decode HTML entities like &#039; to actual characters.
	 *
	 * @param {string} str - The string containing HTML entities.
	 * @return {string} The decoded string.
	 */
	private decodeHtmlEntities( str: string ): string {
		if ( ! str ) {
			return str;
		}
		if ( typeof window === 'undefined' ) {
			return str; // Safety check
		}
		const txt = document.createElement( 'textarea' );
		txt.innerHTML = str;
		return txt.value;
	}
}
