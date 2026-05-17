/**
 * Get base64 from url image
 * @param url
 */
export const getBase64FromUrl = async ( url ) => {
	const data = await fetch( url );
	const blob = await data.blob();

	return new Promise( ( resolve ) => {
		const reader = new FileReader();
		reader.readAsDataURL( blob );
		reader.onloadend = () => {
			const base64data = reader.result;
			resolve( base64data );
		};
	} );
};
/**
 * Returns true if the element is a title
 */
export const titleRegex = new RegExp( '/?H[1-6]' );
/**
 * Returns true if the element is a text node
 * @param value
 * @param selectEl
 */
export const ifElement = ( value, selectEl = [ 'P', 'LI', 'B' ] ) =>
	selectEl.indexOf( value ) > -1 || titleRegex.test( value );

/**
 * Removes null values from an object tree
 * @param tree
 */
export const removeNulls = ( tree: ArrayLike< unknown > ) =>
	Object.values( tree ).filter(
		( value ) =>
			Object.keys( value as Record< string, unknown > ).length !== 0
	);
