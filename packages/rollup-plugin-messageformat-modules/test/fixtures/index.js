import i18n from './runtime';
import a from './a.locales.yaml';
import b from './b.locales.yaml';
import c from './other';

export default lanuage =>
    i18n
        .setLocale(lanuage)
        .load()
        .then(() => {
            return {
                hello: i18n.translate(a.hello, { name: 'John' }),
                count: i18n.translate(b.count, { count: 4 }),
                coverage: i18n.translate(c.coverage, { p: 0.81 }),
                async: import('./async').then(({ default: d }) =>
                    i18n.load().then(() => i18n.translate(d.example)),
                ),
            };
        });
