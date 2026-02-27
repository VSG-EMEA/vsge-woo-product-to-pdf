// src/view.ts
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
	// Fallback to 'page' endpoint if the type isn't 'product'
	const endpoint =
		type === 'product'
			? apiConfig.endpoints.product
			: apiConfig.endpoints.page;
	return await apiFetch( {
		path: `${ endpoint }/${ id }${ apiConfig.queryParams }`,
	} );
}

// 3. Attach event listeners
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

		const postId = Number( downloadButton.dataset.postId );
		const postType = downloadButton.dataset.postType || 'page';

		if ( ! postId ) {
			return;
		}

		downloadButton.classList.add( 'loading' );

		try {
			// Fetch the data
			const data: any = await getPostData( postId, postType );

			// Define global brand settings (these could later be pulled from the WP database)
			const globalSettings = {
				siteUrl: window.location.origin,
				primaryColor: '#0064bd', // Your main brand color
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
