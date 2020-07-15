export function toMessagesMap(
    messages: Record<string, string>,
    keyHashFn: (key: string) => string
) {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [key]: `${key}_${keyHashFn(key)}`,
        }),
        {}
    );
}

export function mapMessageKeys(
    messages: Record<string, string>,
    messagesMap: Record<string, string>
) {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [messagesMap[key]]: messages[key],
        }),
        {}
    );
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

// Copied from Rollup: https://github.com/rollup/rollup/blob/master/src/ast/nodes/MetaProperty.ts

const getResolveUrl = (path: string, URL = 'URL') => `new ${URL}(${path}).href`;

const getRelativeUrlFromDocument = (relativePath: string) =>
getResolveUrl(
    `'${relativePath}', document.currentScript && document.currentScript.src || document.baseURI`
	);

export const relativeUrlMechanisms: Record<string, (relativePath: string) => string> = {
	amd: relativePath => {
		if (relativePath[0] !== '.') relativePath = './' + relativePath;
		return getResolveUrl(`require.toUrl('${relativePath}'), document.baseURI`);
	},
	cjs: relativePath =>
		`(typeof document === 'undefined' ? ${getResolveUrl(
			`'file:' + __dirname + '/${relativePath}'`,
			`(require('u' + 'rl').URL)`
		)} : ${getRelativeUrlFromDocument(relativePath)})`,
	es: relativePath => getResolveUrl(`'${relativePath}', import.meta.url`),
	iife: relativePath => getRelativeUrlFromDocument(relativePath),
	system: relativePath => getResolveUrl(`'${relativePath}', module.meta.url`),
	umd: relativePath =>
		`(typeof document === 'undefined' ? ${getResolveUrl(
			`'file:' + __dirname + '/${relativePath}'`,
			`(require('u' + 'rl').URL)`
		)} : ${getRelativeUrlFromDocument(relativePath)})`
};

export const messagesFormatExport: Record<string, string | undefined> = {
    amd: 'module.exports',
	cjs: 'module.exports',
	es: 'export default',
	iife: '', // TODO
	system: '', // TODO
	umd: undefined,
}