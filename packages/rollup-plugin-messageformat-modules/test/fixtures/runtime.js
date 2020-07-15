export default {
    maps: [],
    translations: {},
    register(map) {
        this.maps.push(map);
    },
    setLocale(language) {
        this.language = language;

        return this;
    },
    async load() {
        const language = this.language;
        const results = await Promise.all(
            this.maps
                .map(map => map[language])
                .filter(Boolean)
                .map(src => src.replace('http://localhost', '.'))
                .map(src => import(src).then(({ default: translations }) => translations),
            ),
        );
        this.translations = results.reduce(
            (prev, translations) => ({ ...prev, ...translations }),
            {},
        );
    },
    translate(key, args) {
        return this.translations[key](args);
    }
};
