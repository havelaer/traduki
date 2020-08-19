/**
 * @jest-environment node
 */
import runtimeInstance from '../src';

describe('runtime', () => {
    let runtime: any;
    let spyWarn;
    let spyError;

    beforeEach(() => {
        // @ts-ignore
        runtime = new runtimeInstance.constructor();
        spyWarn = jest.spyOn(global.console, 'warn').mockImplementation();
        spyError = jest.spyOn(global.console, 'error').mockImplementation();
    });

    afterEach(() => {
        spyWarn.mockRestore();
        spyError.mockRestore();
    });

    describe('setLocale / getLocale', () => {
        it('should have set en get runtime locale', () => {
            runtime.setLocale('en');
            expect(runtime.getLocale()).toBe('en');
        });

        it('should return instance after setting locale', () => {
            expect(runtime.setLocale('en')).toBe(runtime);
        });
    });

    describe('register', () => {
        it('should register import callbacks for each locale', () => {
            expect(() => {
                runtime.register({
                    en: () => Promise.resolve({}),
                    nl: () => Promise.resolve({}),
                });
            }).not.toThrow();
        });

        it('should warn when not providing importer', () => {
            runtime.register({
                en: () => Promise.resolve({}),
                nl: { key: 'Foo' },
            });

            expect(console.warn).toBeCalledWith(
                `[traduki] Expected a function, instead received 'object'`,
            );
        });
    });

    describe('load', () => {
        it('should call locale importer', async () => {
            const enImporter = jest.fn().mockResolvedValue({});

            runtime.register({
                en: () => enImporter(),
            });

            expect(enImporter).not.toBeCalled();

            await runtime.setLocale('en').load();
            expect(enImporter).toBeCalledTimes(1);
        });

        it('should call locale importer once and merge new registered importer results', async () => {
            const enImporter1 = jest.fn().mockResolvedValue({ key1_hash: () => 'Foo' });
            const enImporter2 = jest.fn().mockResolvedValue({ key2_hash: () => 'Bar' });

            expect(enImporter1).not.toBeCalled();
            expect(runtime.hasKey('key1_hash')).toBe(false);

            // first
            runtime.register({
                en: () => enImporter1(),
            });

            await runtime.setLocale('en').load();
            expect(enImporter1).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(true);
            expect(runtime.hasKey('key2_hash')).toBe(false);

            // second
            runtime.register({
                en: () => enImporter2(),
            });

            await runtime.setLocale('en').load();
            expect(enImporter1).toBeCalledTimes(1);
            expect(enImporter2).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(true);
            expect(runtime.hasKey('key2_hash')).toBe(true);
        });

        it('should not cache locale importer results when toggeling between locales ', async () => {
            const nlImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'FooNL' });
            const enImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'FooEN' });

            runtime.register({
                en: () => enImporter(),
                nl: () => nlImporter(),
            });

            expect(enImporter).not.toBeCalled();
            expect(nlImporter).not.toBeCalled();

            await runtime.setLocale('en').load();
            expect(enImporter).toBeCalledTimes(1);
            expect(nlImporter).not.toBeCalled();

            await runtime.setLocale('nl').load();
            expect(enImporter).toBeCalledTimes(1);
            expect(nlImporter).toBeCalledTimes(1);

            await runtime.setLocale('en').load();
            expect(enImporter).toBeCalledTimes(2); // Called again
            expect(nlImporter).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(true);
        });

        it('should fail gracefully when one import fails', async () => {
            const error = new Error('import error');
            const enImporter1 = jest.fn().mockResolvedValue({ key1_hash: () => 'Hoi' });
            const enImporter2 = jest.fn().mockResolvedValue({ key2_hash: () => 'Doei' });
            const enImporterFail = jest.fn().mockRejectedValue(error);

            runtime.register({
                en: () => enImporter1(),
            });

            runtime.register({
                en: () => enImporterFail(),
            });

            runtime.register({
                en: () => enImporter2(),
            });

            await runtime.setLocale('en').load();

            expect(enImporter1).toBeCalledTimes(1);
            expect(enImporter2).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith('[traduki] Error calling locale importer');
            expect(runtime.hasKey('key1_hash')).toBe(true);
            expect(runtime.hasKey('key2_hash')).toBe(true);
        });
    });

    describe('translate', () => {
        it('should translate given message key', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: () => 'Hey' }),
                nl: () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.setLocale('en').load();
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });

        it('should translate given message key with args', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: () => 'Hey' }),
                nl: () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.setLocale('en').load();
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });

        it('should warn when giving unknown key', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: () => 'Hey' }),
                nl: () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.setLocale('en').load();
            expect(runtime.translate('unknownKey_hash')).toBe('unknownKey_hash');
            expect(console.warn).toBeCalledWith(
                `[traduki] Global message key 'unknownKey_hash' does not exit, or is not loaded yet.`,
            );
        });

        it('should translate with arguments', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: d => `Hey ${d.name}` }),
                nl: () => Promise.resolve({ key1_hash: d => `Hoi ${d.name}` }),
            });
            await runtime.setLocale('en').load();
            const pending = runtime.setLocale('nl').load();
            expect(runtime.translate('key1_hash', { name: 'John' })).toBe('Hey John');

            await pending;

            expect(runtime.translate('key1_hash', { name: 'John' })).toBe('Hoi John');
        });

        it('should not crash when forgetting the arguments', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: d => `Hey ${d.name}` }),
                nl: () => Promise.resolve({ key1_hash: d => `Hoi ${d.name}` }),
            });
            await runtime.setLocale('en').load();
            const pending = runtime.setLocale('nl').load();
            expect(runtime.translate('key1_hash')).toBe('Hey undefined');

            await pending;

            expect(runtime.translate('key1_hash')).toBe('Hoi undefined');
        });

        it('should be possible to toggle locales several times', async () => {
            runtime.register({
                en: () => Promise.resolve({ key1_hash: () => 'Hey' }),
                nl: () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.setLocale('en').load();
            expect(runtime.translate('key1_hash')).toBe('Hey');

            await runtime.setLocale('nl').load();
            expect(runtime.translate('key1_hash')).toBe('Hoi');

            await runtime.setLocale('en').load();
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });
    });
});
