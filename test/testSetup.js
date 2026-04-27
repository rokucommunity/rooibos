if (typeof globalThis.fetch !== 'function') {
    Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        writable: true,
        value: async function fetch() {
            throw new Error('Unexpected fetch call during tests on Node 16');
        }
    });
}