import {
    generateMapping,
    parseYaml,
    RegisterMap,
    toMessagesMap,
    transformMessageKeys,
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

    const dictionaries = parseYaml(contents);
    const locales = Object.keys(dictionaries);
    const messages = dictionaries[locales[0]];
    const messagesMap = toMessagesMap(messages, this.resourcePath);

    const compiler = this._compiler;
    const isChildCompiler = compiler.isChild();
    const parentCompiler = isChildCompiler ? compiler.parentCompilation.compiler : null;

    const plugin = parentCompiler
        ? parentCompiler.options.plugins.find((p: any) => p[pluginName])
        : this[pluginName];

    if (typeof plugin === 'undefined') {
        throw new Error(`${pluginName} requires the corresponding plugin`);
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

    return generateMapping(messagesMap, registerMap, plugin.options.runtimeModuleId);
}

export default loader;
