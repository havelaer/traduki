declare global {
    interface Window { dynamicImport: any; }
}

type PrecompiledMessages = Record<string, (arg?: Record<string, string | number>) => string>;

type MessagesSource = string | (() => Promise<any>) | (() => any);

function getDefaultExport(mod: any) {
    return mod['default'] ? mod['default'] : mod;
}

/**
 * Resolve messages source
 * Source is either a url (string), a function returning a `require()` or a function returning an `import()`
 */
function resolveMessagesSource(source: MessagesSource) {
    if (typeof source !== 'function') {
        throw new Error(`[traduki] Expected a function, instead received ${typeof source}`);
    }
    const result = source();

    if (result.then) {
        return result.then(getDefaultExport);
    }

    return Promise.resolve(getDefaultExport(result));
}

class TradukiRuntime {
    private messageMaps: Record<string, MessagesSource>[] = [];
    private messages: PrecompiledMessages = {};
    private locale: string = '';

    register(map: Record<string, string>) {
        this.messageMaps.push(map);

        if (this.locale) this.load();
    }

    setLocale(locale: string) {
        this.locale = locale;

        return this;
    }

    async load() {
        const locale = this.locale;

        const results = await Promise.all(
            this.messageMaps
                .map(map => map[locale])
                .filter(Boolean)
                .map(resolveMessagesSource)
        );

        this.messages = results.reduce(
            (prev, messages) => ({ ...prev, ...messages }),
            {},
        );
    }

    translate(key: string, args?: Record<string, string | number>) {
        if (!this.messages[key]) {
            console.warn(`[traduki] Global message key '${key}' does not exit, or is not loaded yet.`);
            return key;
        }

        return this.messages[key](args);
    }
}

export default new TradukiRuntime();
