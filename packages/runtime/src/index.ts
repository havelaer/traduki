type Locale = string;

type PrecompiledMessages = Record<string, (arg?: Record<string, string | number>) => string>;

type ImportedModule = { default: PrecompiledMessages } | PrecompiledMessages;

type Importer = (() => Promise<ImportedModule>) | (() => ImportedModule);

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

function isPromise<T>(maybePromise: any): maybePromise is Promise<T> {
    return typeof maybePromise.then === 'function';
}

function getDefaultExport(mod: ImportedModule): PrecompiledMessages {
    // @ts-ignore
    return mod['default'] ? mod['default'] : mod;
}

function warn(message: string, err?: Error) {
    console.warn(message);
    if (err) console.error(err);
}

const EMPTY_OBJECT = {};

/**
 * Resolve messages importer
 * Source is either a url (string), a function returning a `require()` or a function returning an `import()`
 */
function resolveImporter(importer: Importer): Promise<PrecompiledMessages | null> {
    if (typeof importer !== 'function') {
        warn(`[traduki] Expected a function, instead received ${typeof importer}`);
        return Promise.resolve(null);
    }

    try {
        const result = importer();

        if (isPromise<ImportedModule>(result)) {
            return result.then(getDefaultExport).catch((error: Error) => {
                warn(`[traduki] Error calling locale importer`, error);
                return null;
            });
        }

        return Promise.resolve(getDefaultExport(result));
    } catch (error) {
        warn(`[traduki] Error calling locale importer`, error);
        return Promise.resolve(null);
    }
}

class TradukiRuntime {
    private queue: Record<Locale, Importer[]> = {};
    private loadingOrDone: Importer[] = [];
    private currentMessages: PrecompiledMessages | null = null;
    private locale: string = '';

    private isLoadingOrDone(importer: Importer) {
        return this.loadingOrDone.indexOf(importer) > -1;
    }

    private resetLoadingOrDone() {
        this.queue[this.locale] = [...this.queue[this.locale], ...this.loadingOrDone];
        this.loadingOrDone = [];
    }

    register(map: Record<string, Importer>) {
        Object.keys(map).forEach(locale => {
            const importer = map[locale];

            if (!(typeof importer === 'function')) {
                warn(`[traduki] Expected a function, instead received '${typeof importer}'`);
            }

            if (!this.queue[locale]) this.queue[locale] = [];

            if (this.isLoadingOrDone(importer)) return;

            this.queue[locale].push(map[locale]);
        });
    }

    setLocale(locale: string) {
        if (locale !== this.locale && this.queue[this.locale]) {
            this.resetLoadingOrDone();
        }

        this.locale = locale;

        return this;
    }

    getLocale() {
        return this.locale;
    }

    status() {
        return {
            queued: this.queue[this.locale].length,
            loadingOrDone: this.loadingOrDone.length,
        };
    }

    // @ts-ignore
    private previousBatches: Promise<(PrecompiledMessages | null)[]> = Promise.resolve();

    async load() {
        const locale = this.locale;

        if (!locale) {
            warn(`[traduki] Called load(), but no locale was set.`);
            return;
        }

        const batch: Importer[] = [];
        let importer: Importer | undefined;

        while ((importer = this.queue[locale].pop())) {
            batch.push(importer);
            this.loadingOrDone.push(importer);
        }

        const batchPromise = Promise.all(batch.map(resolveImporter));
        this.previousBatches = this.previousBatches
            .then(() => batchPromise)
            .catch(() => batchPromise);
        const results = await this.previousBatches;

        const newmessages = results
            .filter(notEmpty)
            .reduce((prev, messages) => ({ ...prev, ...messages }), {} as PrecompiledMessages);

        this.currentMessages = {
            ...this.currentMessages,
            ...newmessages,
        };
    }

    hasKey(key: string) {
        return !!(this.currentMessages && this.currentMessages[key]);
    }

    translate(key: string, args?: Record<string, string | number>) {
        if (!this.currentMessages) {
            warn(`[traduki] No messages loaded yet`);
            return key;
        }

        if (!this.hasKey(key)) {
            warn(`[traduki] Global message key '${key}' does not exit, or is not loaded yet.`);
            return key;
        }

        return this.currentMessages[key](args || EMPTY_OBJECT);
    }
}

export default new TradukiRuntime();
