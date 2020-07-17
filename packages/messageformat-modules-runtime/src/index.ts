class Runtime {
    private maps: Record<string, string>[] = [];
    private translations: Record<string, (arg: Record<string, string>) => string> = {};
    private language: string = '';

    register(map: Record<string, string>) {
        this.maps.push(map);
    }

    setLocale(language: string) {
        this.language = language;

        return this;
    }

    async load() {
        const language = this.language;
        const results = await Promise.all(
            this.maps
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

    translate(key: string, args: Record<string, string>) {
        return this.translations[key](args);
    }
}

export default new Runtime();
