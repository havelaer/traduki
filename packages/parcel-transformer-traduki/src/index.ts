const { Transformer } = require('@parcel/plugin');
import {
    generateMapping,
    readYaml,
    toMessagesMap,
    generatePrecompiledMessages,
} from '@traduki/build-utils';

export default new Transformer({
    async transform({ asset }: any) {
        console.log(asset);

        const dictionaries = await readYaml(asset.filePath);
        const locales = Object.keys(dictionaries);
        const messages = dictionaries[locales[0]];
        const messagesMap = toMessagesMap(messages, asset.filePath);
        const parts = [asset];
        const registerMap = locales.reduce((map, locale) => {
            parts.push({
                type: `${asset.type}-${locale}`,
                filePath: asset.filePath,
                uniqueKey: `${asset.filePath}.${locale}`,
                // type: 'messages',
                // content: generatePrecompiledMessages(locale, dictionaries[locale], 'esm'),
                content: JSON.stringify(dictionaries[locale]),
                meta: { locale, hasDependencies: false },
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
