import {
    createElement as h,
    FC,
    createContext,
    useContext,
    useState,
    useMemo,
    useEffect,
    lazy as originalLazy,
} from './deps';
import traduki from '@traduki/runtime';

export type Translator = (text: string, args?: Record<string, string | number>) => string;

interface TradukiContextProps {
    readonly locale: string | null;
    switchTo(locale: string): void;
}

export const TradukiContext = createContext<TradukiContextProps | null>(null);

export function useLocale(): [string | null, (locale: string) => void] {
    const context = useContext(TradukiContext);
    if (!context) {
        throw new Error(`useLocale must be used within a TradukiProvider`);
    }

    return [context.locale, context.switchTo];
}

export function useTranslator(): Translator {
    const context = useContext(TradukiContext);

    if (!context) {
        throw new Error(`useTranslator must be used within a TradukiProvider`);
    }

    return (key, args = {}) => {
        return traduki.translate(key, args);
    };
}

interface TradukiProviderProps {
    initialLocale: string;
}

/*
 * Application provider needed for the provided hooks
 * During initialization it loads the locale based messages files.
 */
export const TradukiProvider: FC<TradukiProviderProps> = ({ initialLocale, children }) => {
    const [locale, setLocale] = useState<string | null>(null);

    useEffect(() => {
        if (!traduki.currentLocale) traduki.switchTo(initialLocale);

        return traduki.subscribe(() => {
            setLocale(traduki.currentLocale);
        });
    }, []);

    const context: TradukiContextProps = useMemo(
        () => ({
            get locale() {
                return traduki.currentLocale;
            },
            switchTo(locale: string) {
                traduki.switchTo(locale);
            },
        }),
        [locale],
    );

    if (!context.locale) return null;

    return <TradukiContext.Provider value={context}>{children}</TradukiContext.Provider>;
};

/*
 * Wrapper around lazy
 * It loads the locale based messages files before resolving the import factory promise
 */
export const lazy: typeof originalLazy = factory => {
    return originalLazy(() => factory().then(result => traduki.ready().then(() => result)));
};

/*
 * The default export is the traduki runtime
 * Use this as runtimeModuleId `@traduki/(p)react` in the rollup/vite/webpack plugin
 */
export default traduki;
