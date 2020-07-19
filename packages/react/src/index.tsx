import React, { useMemo } from 'react';
import runtime from '@lazy-lion/runtime';
import { Remarkable } from 'remarkable';

const md = new Remarkable();

export type Translator = (
    text: string,
    args?: Record<string, string | number>,
) => string;

export type TranslateHelper = Translator & {
    md: Translator;
};

interface LazyLionContextProps {
    locale: string | null;
    setLocale(locale: string): void;
}

export const LazyLionContext = React.createContext<LazyLionContextProps | null>(
    null,
);

export function useLocale(): [string | null, (locale: string) => void] {
    const context = React.useContext(LazyLionContext);
    if (!context) {
        throw new Error(`useLocale must be used within a LazyLionProvider`);
    }

    return [context.locale, context.setLocale];
}

export function useTranslations(): TranslateHelper {
    const context = React.useContext(LazyLionContext);

    if (!context) {
        throw new Error(
            `useTranslations must be used within a LazyLionProvider`,
        );
    }

    const translator: Translator = (key, args = {}) => {
        return runtime.translate(key, args);
    };

    const translatorMarkdown: Translator = (key, args = {}) => {
        return md.render(translator(key, args));
    };

    return useMemo(() => {
        (translator as any).md = translatorMarkdown;

        return translator as TranslateHelper;
    }, []);
}

interface LazyLionProviderProps {
    initialLocale: string;
}

/*
 * Application provider needed for the provided react hooks
 * During initialization it loads the locale based messages files.
 */
export const LazyLionProvider: React.FC<LazyLionProviderProps> = ({
    initialLocale,
    children,
}) => {
    const [locale, setLocale] = React.useState<string | null>(null);

    const updateLocale = (locale: string) => {
        runtime.setLocale(locale);
        runtime.load().then(() => setLocale(locale));
    }

    React.useMemo(() => updateLocale(initialLocale), []);

    const context: LazyLionContextProps = React.useMemo(() => {
        return {
            locale,
            setLocale(locale: string) {
                updateLocale(locale);
            },
        };
    }, [locale]);

    React.useEffect(() => {
        if (context.locale) document.querySelector('html')!.setAttribute('lang', context.locale);
    }, [context]);

    if (!context.locale) return null;

    return (
        <LazyLionContext.Provider value={context}>
            {children}
        </LazyLionContext.Provider>
    );
};

/*
 * Wrapper around React.lazy
 * It loads the locale based messages files before resolving the import factory promise
 */
export const lazy: typeof React.lazy = factory => {
    return React.lazy(() => factory().then(result => runtime.load().then(() => result)));
}
