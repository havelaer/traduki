const { Transformer } = require('@parcel/plugin');
import {
    generateMapping,
    readYaml,
    toMessagesMap,
    generatePrecompiledMessages,
} from '@traduki/build-utils';

export default new Transformer({
    async transform({ asset }: any) {
        if (asset.meta.locale) {
            asset.type = 'js';
            return [asset];
        }

        const dictionaries = await readYaml(asset.filePath);
        const locales = Object.keys(dictionaries);
        const messages = dictionaries[locales[0]];
        const messagesMap = toMessagesMap(messages, asset.filePath);
        const parts = [asset];
        const registerMap = locales.reduce((map, locale) => {
            parts.push({
                uniqueKey: `${asset.filePath}.${locale}`,
                type: 'ts',
                content: generatePrecompiledMessages(locale, dictionaries[locale], 'esm'),
            });

            return {
                ...map,
                [locale]: `'asdf'`, // TODO
            };
        }, {});

        asset.type = 'js';
        asset.setCode(generateMapping('@traduki/runtime', registerMap, messagesMap, 'esm'));

        return parts;
    },
});
