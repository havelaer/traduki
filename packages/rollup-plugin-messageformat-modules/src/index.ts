import * as fs from 'fs';
import hash from 'hash-sum';
import * as Yaml from 'js-yaml';
import * as path from 'path';
import { Plugin } from 'rollup';
import { mapMessageKeys, notEmpty, toMessagesMap } from './helpers';

type KeyHashArgs = {
    key: string;
    path: string;
};

type PluginOptions = {
    runtimeModuleId?: string;
    fallback?: string;
    supported?: string[];
    keyHashFn?: (args: KeyHashArgs) => string;
    endsWith?: string;
};

function defaultKeyHashFn({ key, path }: KeyHashArgs) {
    return hash(`${key}_${path}`);
}

export const messageformatModules = (options: PluginOptions = {}): Plugin => {
    const {
        runtimeModuleId = 'messageformat-modules-runtime',
        fallback = 'en',
        supported = ['en'],
        keyHashFn = defaultKeyHashFn,
        endsWith = '.yaml',
    } = options;

    return {
        name: 'i18n',
        resolveId(source, importer) {
            if (importer && source.endsWith(endsWith)) {
                return path.resolve(path.dirname(importer), source);
            }
        },
        load(id) {
            if (!id.endsWith(endsWith)) return;

            const content = fs.readFileSync(id, { encoding: 'utf8' });
            const dictionaries = Yaml.load(content);
            const messages = dictionaries[fallback];
            const messagesMap = toMessagesMap(messages, key =>
                keyHashFn({
                    key,
                    path: id,
                }),
            );
            const fileName = `${path.basename(id, endsWith)}`;

            const references = supported
                .map(language => {
                    if (!dictionaries.hasOwnProperty(language)) {
                        console.warn(`[i18n] Missing language ${language} for ${id}`);
                        return;
                    }

                    const name = `${fileName}.${language}.js`;

                    // TODO: only for entry files and chunks
                    const referenceId = this.emitFile({
                        name,
                        type: 'asset',
                        source: `export default ${JSON.stringify(
                            mapMessageKeys(dictionaries[language], messagesMap),
                        )};`,
                    });

                    return { language, referenceId };
                })
                .filter(notEmpty);

            const jsonExport = JSON.stringify(
                messagesMap,
            );
            const registerMap = references
                .map(
                    ({ language, referenceId }) =>
                        `${language}: import.meta.ROLLUP_FILE_URL_${referenceId}`,
                )
                .join(',');

            return `
                import runtime from '${runtimeModuleId}';

                runtime.register({${registerMap}});

                export default ${jsonExport};
            `;
        },
    };
};
