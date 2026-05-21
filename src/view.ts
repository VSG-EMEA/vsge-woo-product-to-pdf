import './view.scss';
import apiFetch from '@wordpress/api-fetch';
import { PDFGenerator } from './PDFGenerator';

// 1. Setup a basic configuration object
const apiConfig = {
	endpoints: {
		product: '/wc/v3/products',
		page: '/wp/v2/pages',
		post: '/wp/v2/posts',
	},
	// You can add query parameters here to optimize API speed (e.g., '?_fields=id,name...')
	queryParams: '',
};

// 2. Fetch data dynamically based on the type
/**
 *
 * @param id
 * @param type
 */
async function getPostData( id: number, type: string ) {
	const wpSettings = ( window as any ).VSGE_PDF_Settings || {};
	let query = apiConfig.queryParams || '';

	if ( wpSettings.currentLanguage ) {
		query += ( query ? '&' : '?' ) + 'lang=' + wpSettings.currentLanguage;
	}

	// Fallback to 'page' endpoint if the type isn't 'product'
	const endpoint =
		type === 'product'
			? apiConfig.endpoints.product
			: apiConfig.endpoints.page;
	return await apiFetch( {
		path: `${ endpoint }/${ id }${ query }`,
	} );
}

/**
 * Get post ID from body classes
 *
 * @return {number} Post ID
 */
function getPostIdFromBody(): number {
	const bodyClasses = document.body.classList;
	for ( const className of bodyClasses ) {
		const match = className.match( /^postid-(\d+)$/ );
		if ( match ) {
			return Number( match[ 1 ] );
		}
	}
	return 0;
}

/**
 * Get post type from body classes
 *
 * @return {string} Post type ('product' or 'page')
 */
function getPostTypeFromBody(): string {
	return document.body.classList.contains( 'single-product' )
		? 'product'
		: 'page';
}

// 4. Attach event listeners
const downloadButtons = document.querySelectorAll< HTMLAnchorElement >(
	'.wp-block-vsge-save-pdf-button'
);

downloadButtons.forEach( ( downloadButton ) => {
	downloadButton.addEventListener( 'click', async ( e ) => {
		e.preventDefault();

		// Prevent multiple clicks
		if ( downloadButton.classList.contains( 'loading' ) ) {
			console.log( 'Please wait, generating PDF...' );
			return;
		}

		// Try to get post ID from dataset first, then fallback to body classes
		let postId = Number( downloadButton.dataset.postId );
		if ( ! postId ) {
			postId = getPostIdFromBody();
		}

		// Try to get post type from dataset first, then fallback to body classes
		let postType = downloadButton.dataset.postType;
		if ( ! postType ) {
			postType = getPostTypeFromBody();
		}

		if ( ! postId ) {
			console.error( 'Could not determine post ID' );
			return;
		}

		downloadButton.classList.add( 'loading' );

		try {
			// Fetch the data
			const data: any = await getPostData( postId, postType );

			// Define global brand settings from WP window object if available
			const wpSettings = ( window as any ).VSGE_PDF_Settings || {};
			const globalSettings = {
				...wpSettings,
				siteUrl: window.location.origin,
				logoBase64: null, // Optional: base64 string of your logo
			};

			// Instantiate the new generator and trigger download
			const pdfGen = new PDFGenerator( data, postType, globalSettings );
			await pdfGen.processAndDownload();
		} catch ( error ) {
			console.error( 'Error generating PDF:', error );
		} finally {
			downloadButton.classList.remove( 'loading' );
			console.log( 'PDF generated successfully!' );
		}
	} );
} );
