class TradukiRuntime {
    private messageMaps: Record<string, string>[] = [];
    private messages: Record<string, (arg: Record<string, string | number>) => string> = {};
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
                .map(src => import(src).then(({ default: messages }) => messages),
            ),
        );

        this.messages = results.reduce(
            (prev, messages) => ({ ...prev, ...messages }),
            {},
        );
    }

    translate(key: string, args: Record<string, string | number>) {
        if (!this.messages[key]) {
            console.warn(`[traduki] Global message key '${key}' does not exit, or is not loaded yet.`);
            return key;
        }

        return this.messages[key](args);
    }
}

export default new TradukiRuntime();
