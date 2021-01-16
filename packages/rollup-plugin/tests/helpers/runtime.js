export default {
    maps: [],
    translations: {},
    register(map) {
        this.maps.push(map);
    },
    async switchTo(locale) {
        const locale = this.locale;
        const results = await Promise.all(
            this.maps
                .map(map => map[locale])
                .filter(Boolean)
                .map(src => src().then(({ default: translations }) => translations),
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
