type Locale = string;

type PrecompiledMessages = Record<string, (arg?: Record<string, string | number>) => string>;

type ImportedModule = { default: PrecompiledMessages } | PrecompiledMessages;

type Importer = (() => Promise<ImportedModule>) | (() => ImportedModule);

type ImporterResult = Promise<PrecompiledMessages | null>;

type Subscriber = (locale: string) => void;

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
function resolveImporter(importer: Importer): ImporterResult {
    if (typeof importer !== 'function') {
        warn(`[traduki] Expected a function, instead received ${typeof importer}`);
        return Promise.resolve(null);
    }

    try {
        const result = importer();

        if (isPromise<ImportedModule>(result)) {
            return result.then(getDefaultExport).catch((error: Error) => {
                warn(`[traduki] Error calling locale importer`, error);
                return Promise.resolve(null);
            });
        }

        return Promise.resolve(getDefaultExport(result));
    } catch (error) {
        warn(`[traduki] Error calling locale importer`, error);
        return Promise.resolve(null);
    }
}

export class TradukiRuntime {
    private importers = new Map<string, Record<Locale, Importer>>();

    private messages: PrecompiledMessages | null = null;

    private subscribers: Subscriber[] = [];

    private locale: string | null = null;

    private latestLoader: Promise<any> | undefined;

    static getSingleton() {
        let global;
        try {
            global = Function('return this')();
        } catch (e) {
            global = window;
        }

        if (!global.__tradukiRuntime) global.__tradukiRuntime = new TradukiRuntime();

        if (!(global.__tradukiRuntime instanceof TradukiRuntime))
            warn('[traduki] Detected duplicate loaded runtime');

        return global.__tradukiRuntime as TradukiRuntime;
    }

    private load(locale: string) {
        const batch: ImporterResult[] = [];

        this.importers.forEach(map => {
            const importer = map[locale];
            if (importer) batch.push(resolveImporter(importer));
        });

        const loader = Promise.all(batch);

        this.latestLoader = loader;

        return loader.then(results => {
            if (loader !== this.latestLoader) return;

            const newmessages = results
                .filter(notEmpty)
                .reduce((prev, messages) => ({ ...prev, ...messages }), {} as PrecompiledMessages);

            this.messages = newmessages;

            this.locale = locale;

            this.subscribers.forEach(subscriber => subscriber(locale));
        });
    }

    get currentLocale() {
        return this.locale;
    }

    register(identifier: string, map: Record<Locale, Importer>) {
        this.importers.set(identifier, map);

        if (this.locale) this.load(this.locale);
    }

    switchTo(locale: string): Promise<void> {
        if (locale === this.locale) return Promise.resolve();

        return this.load(locale);
    }

    async ready(): Promise<void> {
        if (!this.latestLoader) return;

        const currentLoader = this.latestLoader;

        return currentLoader.then(() => {
            if (currentLoader !== this.latestLoader) return this.ready();
        });
    }

    subscribe(subscriber: Subscriber) {
        this.subscribers.push(subscriber);

        return () => {
            const index = this.subscribers.indexOf(subscriber);
            if (index > -1) this.subscribers.splice(index, 1);
        };
    }

    hasKey(key: string) {
        return !!(this.messages && this.messages[key]);
    }

    translate(key: string, args?: Record<string, string | number>) {
        if (key === undefined) {
            warn(`[traduki] Can't pass undefined as message key to translate.`);
            return 'undefined';
        }

        // In debug mode the messages getter emits the key string wrapped with square backets when not found.
        // The messages getter emits a warning and points to the source file.
        // So here we don't want to warn a second time.
        // See: build-utils > generateExportMapping()
        if (key.startsWith('[') && key.endsWith(']')) {
            return key;
        }

        if (!this.messages) {
            warn(`[traduki] No messages loaded yet`);
            return key;
        }

        if (!this.hasKey(key)) {
            if (key)
                warn(`[traduki] Global message key '${key}' does not exit, or is not loaded yet.`);
            return key;
        }

        return this.messages[key](args || EMPTY_OBJECT);
    }
}

export default TradukiRuntime.getSingleton();
