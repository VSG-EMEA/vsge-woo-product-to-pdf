// THE PDF SETTINGS PASSED FROM WP ENQUEUE
export const assetsPath = 'assets';
export const mainColorHex = '#f00';

/**
 *
 * @param font
 * @param variations
 * @param path
 */
function getFontSet(
	variations: { name: string; filename: string }[],
	path: string
) {
	const fontSet = {};
	variations.forEach( ( variation ) => {
		fontSet[ variation.name ] = path + variation.filename;
	} );
	return fontSet;
}

const font = 'Poppins';
const fontData = [
	{ name: 'light', filename: '/assets/Poppins/Poppins-Light.ttf' },
	{
		name: 'italics',
		filename: '/assets/Poppins/Poppins-Italic.ttf',
	},
	{ name: 'bold', filename: '/assets/Poppins/Poppins-Bold.ttf' },
	{ name: 'bolditalics', filename: '/assets/Poppins/Poppins-BoldItalic.ttf' },
];

export const fonts: { [ key: string ]: Record< string, string > } = {
	[ font ]: getFontSet( fontData, assetsPath ),
};

export const ProductPageTabs = [
	'description',
	'relateds',
	'media',
	'comparison',
];

export const beautifyArgs = {
	indent_size: 0,
	indent_char: '',
	eol: '',
	end_with_newline: false,
	preserve_newlines: false,
	max_preserve_newlines: 0,
	wrap_line_length: 0,
	wrap_attributes: 'auto',
};

// convert millimeters to points (the ratio is 2.835)
export const mmToPoints = ( val ) => val * 2.835;

export const pageSize = {
	width: mmToPoints( 210.0 ),
	height: mmToPoints( 297.0 ),
};
export const pageMargins: [ number, number, number, number ] = [
	20, 40, 20, 30,
];
