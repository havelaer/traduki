import {
    generateImporters,
    generateExportMapping,
    parseYaml,
    RegisterMap,
    toMessagesMap,
    transformMessageKeys,
    assertIsConsistent,
} from '@traduki/build-utils';
import loaderUtils from 'loader-utils';
import validateOptions from 'schema-utils';
import { pluginName } from './constants';

const schema = require('./loader-options').default;

function loader(this: any, contents: string) {
    const options = loaderUtils.getOptions(this) || {};

    validateOptions(schema, options, {
        name: pluginName,
    });

    const compiler = this._compiler;
    const isChildCompiler = compiler.isChild();
    const parentCompiler = isChildCompiler ? compiler.parentCompilation.compiler : null;
    const plugin = parentCompiler
        ? parentCompiler.options.plugins.find((p: any) => p[pluginName])
        : this[pluginName];

    if (typeof plugin === 'undefined') {
        throw new Error(`${pluginName} requires the corresponding plugin`);
    }

    const { strict } = plugin.config;
    const dictionaries = parseYaml(contents);
    const locales = Object.keys(dictionaries);
    const messagesMap = toMessagesMap(dictionaries);

    if (strict && !assertIsConsistent(dictionaries)) {
        const error = new Error(`${strict} Inconsistent messages file: '${this.resourcePath}'`);

        if (strict === 'warn') {
            this.emitWarning(error);
        } else if (strict === 'error') {
            throw error;
        }
    }

    const registerMap = locales.reduce((map: RegisterMap, locale: string) => {
        plugin.addMessages({
            locale,
            resourcePath: this.resourcePath,
            messages: transformMessageKeys(dictionaries[locale], messagesMap),
        });

        const placeholder = plugin.createPlaceHolder(locale);

        return {
            ...map,
            [locale]: `() => import(/* webpackIgnore: true */ '${placeholder}')`,
        };
    }, {} as RegisterMap);

    return [
        generateImporters(registerMap, plugin.config.runtimeModuleId),
        generateExportMapping(messagesMap),
    ].join('\n');
}

export default loader;
