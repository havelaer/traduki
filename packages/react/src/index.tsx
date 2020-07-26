import * as React from 'react';
import runtime from '@traduki/runtime';
import { Remarkable } from 'remarkable';

const md = new Remarkable();

export type Translator = (
    text: string,
    args?: Record<string, string | number>,
) => string;

export type TranslateHelper = Translator & {
    markdown: Translator;
};

interface TradukiContextProps {
    locale: string | null;
    setLocale(locale: string): void;
}

export const TradukiContext = React.createContext<TradukiContextProps | null>(
    null,
);

export function useLocale(): [string | null, (locale: string) => void] {
    const context = React.useContext(TradukiContext);
    if (!context) {
        throw new Error(`useLocale must be used within a TradukiProvider`);
    }

    return [context.locale, context.setLocale];
}

export function useTranslator(): TranslateHelper {
    const context = React.useContext(TradukiContext);

    if (!context) {
        throw new Error(
            `useTranslator must be used within a TradukiProvider`,
        );
    }

    const translator: Translator = (key, args = {}) => {
        return runtime.translate(key, args);
    };

    const translatorMarkdown: Translator = (key, args = {}) => {
        return md.render(translator(key, args));
    };

    return React.useMemo(() => {
        (translator as any).markdown = translatorMarkdown;

        return translator as TranslateHelper;
    }, []);
}

interface TradukiProviderProps {
    initialLocale: string;
}

/*
 * Application provider needed for the provided react hooks
 * During initialization it loads the locale based messages files.
 */
export const TradukiProvider: React.FC<TradukiProviderProps> = ({
    initialLocale,
    children,
}) => {
    const [locale, setLocale] = React.useState<string | null>(null);

    const updateLocale = (locale: string) => {
        runtime.setLocale(locale);
        runtime.load().then(() => setLocale(locale));
    }

    React.useMemo(() => updateLocale(initialLocale), []);

    const context: TradukiContextProps = React.useMemo(() => {
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
        <TradukiContext.Provider value={context}>
            {children}
        </TradukiContext.Provider>
    );
};

/*
 * Wrapper around React.lazy
 * It loads the locale based messages files before resolving the import factory promise
 */
export const lazy: typeof React.lazy = factory => {
    return React.lazy(() => factory().then(result => runtime.load().then(() => result)));
}
