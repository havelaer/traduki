/**
 * @jest-environment node
 */
import runtimeInstance from '../src';


function onUpdated(runtime: any): Promise<void> {
    return new Promise(resolve => {
        runtime.subscribe(() => resolve());
    })
}

describe('runtime', () => {
    let runtime: any;
    let spyWarn: any;
    let spyError: any;

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

    describe('register', () => {
        it('should register import callbacks for each locale', () => {
            expect(() => {
                runtime.register('abcdef', {
                    'en-US': () => Promise.resolve({}),
                    'nl-NL': () => Promise.resolve({}),
                });
            }).not.toThrow();
        });
    });

    describe('switchTo', () => {
        it('should not crash if there is nothing to load', async () => {
            await runtime.switchTo('en-US');
            expect(true).toBe(true);
        });

        it('should switch runtime locale', async () => {
            await runtime.switchTo('en-US');
            expect(runtime.currentLocale).toBe('en-US');
        });

        it('should call locale importer', async () => {
            const enImporter = jest.fn().mockResolvedValue({});

            runtime.register('abcdef', {
                'en-US': () => enImporter(),
            });

            expect(enImporter).not.toBeCalled();

            await runtime.switchTo('en-US');
            expect(enImporter).toBeCalledTimes(1);
        });

        it('should be callable multiple times', async () => {
            const enImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'Foo' });

            runtime.register('abcdef', {
                'en-US': () => enImporter(),
            });

            expect(enImporter).not.toBeCalled();

            runtime.switchTo('en-US');
            await runtime.switchTo('en-US');
            expect(runtime.hasKey('key1_hash')).toBe(true);
        });

        it('should be callable multiple times (2)', async () => {
            const enImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'Foo' });

            runtime.register('abcdef', {
                'en-US': () => enImporter(),
            });

            expect(enImporter).not.toBeCalled();

            await runtime.switchTo('en-US');
            runtime.switchTo('en-US');
            expect(runtime.hasKey('key1_hash')).toBe(true);
        });

        it('should override importer when given same module identifier', async () => {
            const enImporter1 = jest.fn().mockResolvedValue({ key1_hash: () => 'Foo' });
            const enImporter2 = jest.fn().mockResolvedValue({ key2_hash: () => 'Bar' });

            expect(enImporter1).not.toBeCalled();
            expect(runtime.hasKey('key1_hash')).toBe(false);

            // first
            runtime.register('abcdef', {
                'en-US': () => enImporter1(),
            });

            await runtime.switchTo('en-US');
            expect(enImporter1).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(true);
            expect(runtime.hasKey('key2_hash')).toBe(false);

            // second
            runtime.register('abcdef', {
                'en-US': () => enImporter2(),
            });

            await onUpdated(runtime);

            expect(enImporter1).toBeCalledTimes(1);
            expect(enImporter2).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(false);
            expect(runtime.hasKey('key2_hash')).toBe(true);
        });

        it('should not cache locale importer results when toggeling between locales ', async () => {
            const nlImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'FooNL' });
            const enImporter = jest.fn().mockResolvedValue({ key1_hash: () => 'FooEN' });

            runtime.register('abcdef', {
                'en-US': () => enImporter(),
                'nl-NL': () => nlImporter(),
            });

            expect(enImporter).not.toBeCalled();
            expect(nlImporter).not.toBeCalled();

            await runtime.switchTo('en-US');
            expect(enImporter).toBeCalledTimes(1);
            expect(nlImporter).not.toBeCalled();

            await runtime.switchTo('nl-NL');
            expect(enImporter).toBeCalledTimes(1);
            expect(nlImporter).toBeCalledTimes(1);

            await runtime.switchTo('en-US');
            expect(enImporter).toBeCalledTimes(2); // Called again
            expect(nlImporter).toBeCalledTimes(1);
            expect(runtime.hasKey('key1_hash')).toBe(true);
        });

        it('should warn and ignore when one import fails', async () => {
            const error = new Error('import error');
            const enImporter1 = jest.fn().mockResolvedValue({ key1_hash: () => 'Hoi' });
            const enImporter2 = jest.fn().mockResolvedValue({ key2_hash: () => 'Doei' });
            const enImporterFail = jest.fn().mockRejectedValue(error);

            runtime.register('abcdef', {
                'en-US': () => enImporter1(),
            });

            runtime.register('ghijkl', {
                'en-US': () => enImporterFail(),
            });

            runtime.register('mnopqr', {
                'en-US': () => enImporter2(),
            });

            await runtime.switchTo('en-US');

            expect(enImporter1).toBeCalledTimes(1);
            expect(enImporter2).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith('[traduki] Error calling locale importer');
            expect(runtime.hasKey('key1_hash')).toBe(true);
            expect(runtime.hasKey('key2_hash')).toBe(true);
        });
    });

    describe('subscribe', () => {
        it('should be called when locale messages have been updated', async () => {
            const subscriber = jest.fn();

            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Foo' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Bar'}),
            });

            runtime.subscribe(subscriber);
            expect(subscriber).not.toBeCalled();

            await runtime.switchTo('en-US');
            expect(subscriber).toBeCalledTimes(1);
        });
    });

    describe('translate', () => {
        it('should translate given message key', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.switchTo('en-US');
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });

        it('should translate given message key with args', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.switchTo('en-US');
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });

        it('should warn when giving unknown key', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.switchTo('en-US');
            expect(runtime.translate('unknownKey_hash')).toBe('unknownKey_hash');
            expect(console.warn).toBeCalledWith(
                `[traduki] Global message key 'unknownKey_hash' does not exit, or is not loaded yet.`,
            );
        });

        it('should not warn when messages.<key> from *.messages.yaml does not exist', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.switchTo('en-US');
            expect(runtime.translate('[notFoundkey]')).toBe('[notFoundkey]');
            expect(console.warn).not.toBeCalled();
        });

        it('should warn when giving undefined key', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });
            await runtime.switchTo('en-US');
            expect(runtime.translate(undefined)).toBe('undefined');
            expect(console.warn).toBeCalledWith(
                `[traduki] Can't pass undefined as message key to translate.`,
            );
        });

        it('should translate with arguments', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: (d: any) => `Hey ${d.name}` }),
                'nl-NL': () => Promise.resolve({ key1_hash: (d: any) => `Hoi ${d.name}` }),
            });
            await runtime.switchTo('en-US');
            const pending = runtime.switchTo('nl-NL');
            expect(runtime.translate('key1_hash', { name: 'John' })).toBe('Hey John');

            await pending;

            expect(runtime.translate('key1_hash', { name: 'John' })).toBe('Hoi John');
        });

        it('should not crash when forgetting the arguments', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: (d: any) => `Hey ${d.name}` }),
                'nl-NL': () => Promise.resolve({ key1_hash: (d: any) => `Hoi ${d.name}` }),
            });
            await runtime.switchTo('en-US');
            const pending = runtime.switchTo('nl-NL');
            expect(runtime.translate('key1_hash')).toBe('Hey undefined');

            await pending;

            expect(runtime.translate('key1_hash')).toBe('Hoi undefined');
        });

        it('should be possible to toggle locales several times', async () => {
            runtime.register('abcdef', {
                'en-US': () => Promise.resolve({ key1_hash: () => 'Hey' }),
                'nl-NL': () => Promise.resolve({ key1_hash: () => 'Hoi' }),
            });

            await runtime.switchTo('en-US');
            expect(runtime.translate('key1_hash')).toBe('Hey');

            await runtime.switchTo('nl-NL');
            expect(runtime.translate('key1_hash')).toBe('Hoi');

            await runtime.switchTo('en-US');
            expect(runtime.translate('key1_hash')).toBe('Hey');
        });
    });
});
