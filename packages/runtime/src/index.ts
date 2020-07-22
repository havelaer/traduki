class LazyLionRuntime {
    private messageMaps: Record<string, string>[] = [];
    private translations: Record<string, (arg: Record<string, string | number>) => string> = {};
    private language: string = '';

    register(map: Record<string, string>) {
        this.messageMaps.push(map);

        if (this.language) this.load();
    }

    setLocale(language: string) {
        this.language = language;

        return this;
    }

    async load() {
        const language = this.language;
        const results = await Promise.all(
            this.messageMaps
                .map(map => map[language])
                .filter(Boolean)
                .map(src => import(src).then(({ default: translations }) => translations),
            ),
        );
        this.translations = results.reduce(
            (prev, translations) => ({ ...prev, ...translations }),
            {},
        );
    }

    translate(key: string, args: Record<string, string | number>) {
        if (!this.translations[key]) {
            console.warn(`[lazy-lion] Global message key '${key}' does not exit, or is not loaded yet.`);
            return key;
        }

        return this.translations[key](args);
    }
}

export default new LazyLionRuntime();
