const { Transformer } = require('@parcel/plugin');
import {
    generateMapping,
    readYaml,
    toMessagesMap,
    generatePrecompiledMessages,
    transformMessageKeys,
} from '@traduki/build-utils';
import { basename } from 'path';

export default new Transformer({
    async transform({ asset }: any) {
        const dictionaries = await readYaml(asset.filePath);
        const locales = Object.keys(dictionaries);
        const messages = dictionaries[locales[0]];
        const messagesMap = toMessagesMap(messages, asset.filePath);

        if (asset.pipeline) {
            const [, locale] = asset.pipeline.split('-');
            const globalMessages = transformMessageKeys(dictionaries[locale], messagesMap)
            return [
                {
                    type: `js`,
                    uniqueKey: `${asset.id}-${locale}`,
                    content: generatePrecompiledMessages(locale, globalMessages, 'esm'),
                },
            ];
        }

        const registerMap = locales.reduce((map, locale) => {
            const messagesFile = `${asset.filePath}`;

            return {
                ...map,
                [locale]: `() => require('messages-${locale}:./${basename(messagesFile)}')`,
            };
        }, {});

        asset.type = 'js';
        asset.setCode(generateMapping('@traduki/runtime', registerMap, messagesMap, 'esm'));

        return [asset];
    },
});
