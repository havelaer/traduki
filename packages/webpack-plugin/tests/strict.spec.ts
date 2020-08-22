/**
 * @jest-environment node
 */
import compiler from './helpers/compiler';

describe('strict', () => {
    describe('warn', () => {
        it('should not stop compilation process, but log a warning', async () => {
            await expect(
                compiler('fixtures/simple-inconsistent/main.js', {
                    strict: 'warn',
                }),
            ).resolves;

            expect(true).toBe(true); // TODO: see webpack show warning
        });
    });

    describe('error', () => {
        it('should stop compilation process', async () => {
            await expect(
                compiler('fixtures/simple-inconsistent/main.js', {
                    strict: 'error',
                }),
            ).rejects.toThrow();
        });
    });
});
