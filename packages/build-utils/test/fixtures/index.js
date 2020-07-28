import i18n from './runtime';
import a from './a.messages.yaml';
import b from './b.messages.yaml';
import c from './other';

export default async lanuage => {
    const { default: d } = await import('./async');

    await i18n.setLocale(lanuage).load();

    return {
        hello: i18n.translate(a.hello, { name: 'John' }),
        count: i18n.translate(b.count, { count: 4 }),
        coverage: i18n.translate(c.coverage, { p: 0.81 }),
        async: i18n.translate(d.example),
    };
}
