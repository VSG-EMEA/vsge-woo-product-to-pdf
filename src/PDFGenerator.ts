// src/PDFGenerator.ts
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {
	TDocumentDefinitions,
	Content,
	StyleDictionary,
} from 'pdfmake/interfaces';
import { fonts } from './const';

// Register custom fonts
pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = fonts;

export class PDFGenerator {
	private data: any;
	private type: string;
	private settings: any;
	private styles: StyleDictionary;

	constructor( data: any, type: string, settings: any ) {
		this.data = data;
		this.type = type;
		this.settings = settings;

		// Define consistent styles
		this.styles = {
			headerTitle: {
				fontSize: 24,
				bold: true,
				color: '#ffffff',
				margin: [ 0, 10, 0, 0 ],
			},
			h1: { fontSize: 20, bold: true, margin: [ 0, 15, 0, 10 ] },
			h2: {
				fontSize: 16,
				bold: true,
				margin: [ 0, 15, 0, 5 ],
				color: this.settings.primaryColor,
			},
			normal: { fontSize: 10, lineHeight: 1.2 },
			tableHeader: {
				bold: true,
				fontSize: 11,
				color: 'black',
				fillColor: '#f3f3f3',
			},
			footerText: {
				fontSize: 8,
				alignment: 'center',
				margin: [ 0, 10, 0, 0 ],
			},
		};
	}

	public async processAndDownload() {
		const docDefinition = await this.buildDocument();
		const filename = `${ this.data.slug || 'download' }.pdf`;

		// Generate and prompt download
		pdfMake.createPdf( docDefinition ).download( filename );
	}

	private async buildDocument(): Promise< TDocumentDefinitions > {
		return {
			pageSize: 'A4',
			pageMargins: [ 40, 80, 40, 60 ],
			header: this.buildHeader(),
			footer: this.buildFooter.bind( this ), // Bind 'this' to access class properties inside footer
			content:
				this.type === 'product'
					? await this.buildProductContent()
					: this.buildPageContent(),
			styles: this.styles,
			defaultStyle: { fontSize: 10, font: 'Poppins' },
		};
	}

	private buildHeader(): Content {
		return {
			canvas: [
				{
					type: 'rect',
					x: 0,
					y: 0,
					w: 595.28, // A4 Width
					h: 60,
					color: this.settings.primaryColor,
				},
			],
			absolutePosition: { x: 0, y: 0 },
			stack: [
				{
					text: 'Company Brochure',
					style: 'headerTitle',
					margin: [ 40, 15, 0, 0 ],
				},
			],
		};
	}

	private buildFooter( currentPage: number, pageCount: number ): Content {
		return {
			stack: [
				{
					text: `Page ${ currentPage } of ${ pageCount }`,
					style: 'footerText',
				},
				{
					text: `Downloaded from ${ this.settings.siteUrl }`,
					style: 'footerText',
					color: '#0064bd',
				},
			],
			margin: [ 40, 10, 40, 0 ],
		};
	}

	// --- TEMPLATE LOGIC ---

	// Template for Standard Pages
	private buildPageContent(): Content[] {
		return [
			{ text: this.data.title?.rendered || 'Page Document', style: 'h1' },
			{
				text: this.stripHtml( this.data.content?.rendered || '' ),
				style: 'normal',
			},
		];
	}

	// Template for WooCommerce Products
	private async buildProductContent(): Promise< Content[] > {
		const content: Content[] = [];

		// Resolve product image as base64 (required by pdfMake — remote URLs are not supported)
		const imageUrl: string | undefined = this.data.images?.[ 0 ]?.src;
		const imageBase64 = imageUrl
			? await this.imageToBase64( imageUrl )
			: null;

		// Image column: real image or grey placeholder rect
		const imageColumn: Content = imageBase64
			? {
					image: imageBase64,
					width: 210,
					margin: [ 0, 0, 0, 10 ],
					alignment: 'center',
			  }
			: {
					canvas: [
						{
							type: 'rect',
							x: 0,
							y: 0,
							w: 210,
							h: 150,
							color: '#eeeeee',
						},
					],
			  };

		// 1. Two Columns layout: Image & Title/Summary
		content.push( {
			columns: [
				{
					width: '40%',
					stack: [ imageColumn ],
				},
				{
					width: '60%',
					stack: [
						{
							text: this.data.name || 'Product Title',
							style: 'h1',
						},
						{
							text: `SKU: ${ this.data.sku || 'N/A' }`,
							margin: [ 0, 0, 0, 10 ],
							italics: true,
						},
						{
							text: this.stripHtml(
								this.data.short_description || ''
							),
							style: 'normal',
							margin: [ 0, 0, 0, 15 ],
						},
					],
					margin: [ 15, 0, 0, 0 ], // Moved from column padding to stack margin
				},
			],
			columnGap: 20,
			margin: [ 0, 0, 0, 20 ],
		} );

		// 2. Main Description
		content.push( { text: 'Description', style: 'h2' } );
		content.push( {
			text: this.stripHtml( this.data.description || '' ),
			style: 'normal',
			margin: [ 0, 0, 0, 20 ],
		} );

		// 3. Technical Drawing (only if a valid image URL is available)
		const drawingRaw = this.getMetaValue( 'brb_media_drawing' );
		console.log( '[PDF] brb_media_drawing raw:', drawingRaw );
		if ( drawingRaw ) {
			let drawingUrl: string | null = null;
			if ( Array.isArray( drawingRaw ) && drawingRaw.length > 0 ) {
				const first = drawingRaw[ 0 ];
				drawingUrl =
					typeof first === 'object' ? first.url : String( first );
			} else if ( typeof drawingRaw === 'object' && drawingRaw.url ) {
				drawingUrl = drawingRaw.url;
			} else if (
				typeof drawingRaw === 'string' &&
				drawingRaw !== '0' &&
				drawingRaw !== ''
			) {
				drawingUrl = drawingRaw;
			}

			if ( drawingUrl ) {
				const drawingBase64 = await this.imageToBase64( drawingUrl );
				if ( drawingBase64 ) {
					content.push( { text: 'Technical Drawing', style: 'h2' } );
					content.push( {
						image: drawingBase64,
						width: 500,
						margin: [ 0, 0, 0, 20 ],
						alignment: 'center',
					} );
				}
			}
		}

		// 4. Linked Products & Spare Parts (2-column grid with thumbnails)
		const linkedProducts = [
			{ key: 'accessories', label: 'Accessories' },
			{ key: 'components', label: 'Components' },
			{ key: 'delivery', label: 'Delivery' },
			{ key: 'package', label: 'Package' },
			{ key: 'similar', label: 'Similar Products' },
			{ key: 'brb_media_spare_parts', label: 'Spare Parts' }, // Re-added as requested
		];

		for ( const { key, label } of linkedProducts ) {
			const value =
				this.getMetaValue( key ) ||
				this.getMetaValue( `_${ key }_ids` );
			console.log(
				`[PDF] Linked "${ key }":`,
				JSON.stringify( value )?.substring( 0, 300 )
			);
			if ( value && Array.isArray( value ) && value.length > 0 ) {
				content.push( { text: label, style: 'h2' } );
				const gridContent = await this.buildGridLayout( value );
				content.push( gridContent );
			}
		}

		// 4.5 Other Custom Metadata
		const otherMeta = [
			{ key: '_cdmm_p_id', label: 'CDMM Product ID' },
			{ key: '_company', label: 'Company' },
			{ key: '_gtin', label: 'GTIN' },
		];

		for ( const { key, label } of otherMeta ) {
			const value = this.getMetaValue( key );
			if (
				value &&
				typeof value !== 'object' &&
				String( value ) !== '0' &&
				String( value ) !== ''
			) {
				content.push( {
					text: `\u2022 ${ label }: ${ String( value ) }`,
					margin: [ 0, 0, 0, 5 ],
					style: 'normal',
				} );
			}
		}

		content.push( { text: '', margin: [ 0, 0, 0, 15 ] } );

		// 5. Technical Details Table
		if ( this.data.attributes && this.data.attributes.length > 0 ) {
			content.push( {
				text: 'Technical Details',
				style: 'h2',
				pageBreak: 'before',
			} );
			content.push( this.buildAttributesTable( this.data.attributes ) );
		}

		return content;
	}

	private buildAttributesTable( attributes: any[] ): Content {
		const body: any[][] = [
			[
				{ text: 'Attribute', style: 'tableHeader' },
				{ text: 'Value', style: 'tableHeader' },
			],
		];

		attributes.forEach( ( attr ) => {
			const values = Array.isArray( attr.options )
				? attr.options.join( ', ' )
				: attr.options;
			body.push( [ { text: attr.name, bold: true }, { text: values } ] );
		} );

		return {
			table: {
				headerRows: 1,
				widths: [ '30%', '70%' ],
				body,
			},
			layout: 'lightHorizontalLines',
		};
	}

	private async buildGridLayout( items: any[] ): Promise< Content > {
		if ( ! items || items.length === 0 ) {
			return { text: '' };
		}

		const contentRows: Content[] = [];
		for ( let i = 0; i < items.length; i += 2 ) {
			const item1 = items[ i ];
			const item2 = items[ i + 1 ];

			const col1 = await this.buildGridItem( item1 );
			const col2 = item2
				? await this.buildGridItem( item2 )
				: { text: '' };

			contentRows.push( {
				columns: [
					{ width: '48%', stack: [ col1 ] },
					{ width: '4%', text: '' },
					{ width: '48%', stack: [ col2 ] },
				],
				margin: [ 0, 0, 0, 10 ],
			} );
		}

		return { stack: contentRows, margin: [ 0, 0, 0, 20 ] };
	}

	private async buildGridItem( item: any ): Promise< Content > {
		const title: string =
			item.name || item.title || String( item.id || item );
		const desc: string = item.description || '';
		const link: string | null = item.url || null;

		let imageBase64: string | null = null;
		if ( item.thumbnail ) {
			imageBase64 = await this.imageToBase64( item.thumbnail );
			if ( ! imageBase64 ) {
				console.warn(
					'[PDF] Failed to load thumbnail:',
					item.thumbnail
				);
			}
		} else if ( item.url && /\.(png|jpe?g)$/i.test( item.url ) ) {
			imageBase64 = await this.imageToBase64( item.url );
			if ( ! imageBase64 ) {
				console.warn( '[PDF] Failed to load image url:', item.url );
			}
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
							color: '#e0e0e0',
						},
					],
			  };

		const titleContent: Content = link
			? {
					text: title,
					bold: true,
					fontSize: 10,
					color: '#0064bd',
					link,
			  }
			: { text: title, bold: true, fontSize: 10, color: '#000' };

		return {
			table: {
				widths: [ 60, '*' ],
				body: [
					[
						{
							stack: [ imageContent ],
							fillColor: '#f4f4f4',
							margin: [ 5, 5, 5, 5 ],
							border: [ false, false, false, true ],
							borderColor: [ '#fff', '#fff', '#fff', '#eeeeee' ],
						},
						{
							stack: [
								titleContent,
								{
									text: desc,
									fontSize: 8,
									color: '#777',
									margin: [ 0, 4, 0, 0 ],
								},
							],
							border: [ false, false, false, true ],
							borderColor: [ '#fff', '#fff', '#fff', '#eeeeee' ],
							margin: [ 10, 5, 0, 5 ],
						},
					],
				],
			},
			layout: {
				defaultBorder: false,
				hLineWidth( _i: number, node: any ) {
					return _i === node.table.body.length ? 1 : 0;
				},
				hLineColor() {
					return '#eeeeee';
				},
			},
		};
	}

	// --- UTILITIES ---

	/**
	 * Fetch an external image URL and return it as a base64 data URL.
	 * pdfMake cannot load images from remote URLs directly, so we use
	 * fetch + canvas to convert the image on the client side.
	 * Protects against non-image formats (e.g. PDFs) crashing pdfMake.
	 * @param url
	 */
	private async imageToBase64( url: string ): Promise< string | null > {
		try {
			// Explicitly exclude image/webp so the nginx WebP rewrite doesn't
			// kick in — pdfMake only supports PNG and JPEG.
			const response = await fetch( url, {
				headers: { Accept: 'image/png,image/jpeg,image/gif,*/*;q=0.8' },
			} );
			if ( ! response.ok ) {
				return null;
			}
			const blob = await response.blob();
			if ( ! blob.type.startsWith( 'image/' ) ) {
				console.warn(
					'[PDF] URL is not an image:',
					url,
					'MIME:',
					blob.type
				);
				return null; // Prevents "Unknown image format" error in pdfMake
			}
			return await new Promise< string >( ( resolve, reject ) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve( reader.result as string );
				reader.onerror = reject;
				reader.readAsDataURL( blob );
			} );
		} catch {
			return null;
		}
	}

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

	private stripHtml( html: string ): string {
		const tmp = document.createElement( 'DIV' );
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	}
}
