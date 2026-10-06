import { expect } from 'chai';
import { resolveCliDevice } from './resolveCliDevice';

describe('resolveCliDevice', () => {
    describe('LAN host', () => {
        it('prefers argv host over bsconfig and env', () => {
            const result = resolveCliDevice({ host: '1.1.1.1' }, { host: '2.2.2.2' }, { ROKU_HOST: '3.3.3.3' });
            expect(result.device).to.eql({ host: '1.1.1.1' });
            expect(result.label).to.equal('1.1.1.1');
        });

        it('prefers bsconfig host over env', () => {
            expect(resolveCliDevice({}, { host: '2.2.2.2' }, { ROKU_HOST: '3.3.3.3' }).device).to.eql({ host: '2.2.2.2' });
        });

        it('falls back to env host', () => {
            expect(resolveCliDevice({}, {}, { ROKU_HOST: '3.3.3.3' }).device).to.eql({ host: '3.3.3.3' });
        });

        it('errors when no target is available', () => {
            expect(() => resolveCliDevice({}, {}, {})).to.throw(/--host.*ROKU_HOST.*--esn/);
        });

        it('errors when --token is passed with a host', () => {
            expect(() => resolveCliDevice({ host: '1.1.1.1', token: 'secret-token' }, {}, {})).to.throw(/--token only applies/);
        });

        it('silently ignores env ROKU_RCE_TOKEN with a host', () => {
            expect(resolveCliDevice({ host: '1.1.1.1' }, {}, { ROKU_RCE_TOKEN: 'secret-token' }).device).to.eql({ host: '1.1.1.1' });
        });
    });

    describe('Roku Cloud Emulator', () => {
        it('resolves esn with a token', () => {
            const result = resolveCliDevice({ esn: 'ESN1', token: 'secret-token' }, {}, {});
            expect(result.device).to.eql({ esn: 'ESN1', rceToken: 'secret-token' });
            expect(result.label).to.equal('RCE device ESN1');
        });

        it('resolves instanceUrl with the env token', () => {
            const result = resolveCliDevice({ instanceUrl: 'https://rce.example/i/1' }, {}, { ROKU_RCE_TOKEN: 'env-token' });
            expect(result.device).to.eql({ instanceUrl: 'https://rce.example/i/1', rceToken: 'env-token' });
            expect(result.label).to.equal('RCE instance https://rce.example/i/1');
        });

        it('prefers argv token over env token', () => {
            const result = resolveCliDevice({ esn: 'ESN1', token: 'argv-token' }, {}, { ROKU_RCE_TOKEN: 'env-token' });
            expect((result.device as any).rceToken).to.equal('argv-token');
        });

        it('errors without a token', () => {
            expect(() => resolveCliDevice({ esn: 'ESN1' }, {}, {})).to.throw(/--token.*ROKU_RCE_TOKEN/);
            expect(() => resolveCliDevice({ instanceUrl: 'https://x' }, {}, {})).to.throw(/--token.*ROKU_RCE_TOKEN/);
        });

        it('errors when more than one target flag is given', () => {
            expect(() => resolveCliDevice({ host: '1.1.1.1', esn: 'ESN1', token: 't' }, {}, {})).to.throw(/only one/);
            expect(() => resolveCliDevice({ esn: 'ESN1', instanceUrl: 'https://x', token: 't' }, {}, {})).to.throw(/only one/);
        });

        it('ignores bsconfig host and ROKU_HOST', () => {
            const result = resolveCliDevice({ esn: 'ESN1', token: 't' }, { host: '2.2.2.2' }, { ROKU_HOST: '3.3.3.3' });
            expect(result.device).to.eql({ esn: 'ESN1', rceToken: 't' });
        });

        it('never includes the token in labels or error messages', () => {
            const token = 'super-secret-token';
            expect(resolveCliDevice({ esn: 'ESN1', token: token }, {}, {}).label).to.not.include(token);
            expect(resolveCliDevice({ instanceUrl: 'https://x', token: token }, {}, {}).label).to.not.include(token);
            expect(() => resolveCliDevice({ host: '1.1.1.1', token: token }, {}, {})).to.throw().with.property('message').not.include(token);
            expect(() => resolveCliDevice({ host: '1.1.1.1', esn: 'ESN1', token: token }, {}, {})).to.throw().with.property('message').not.include(token);
        });
    });

    describe('malformed flags', () => {
        it('rejects empty identifiers instead of falling back to the host', () => {
            const env = { ROKU_HOST: '3.3.3.3', ROKU_RCE_TOKEN: 't' };
            expect(() => resolveCliDevice({ esn: '' }, { host: '2.2.2.2' }, env)).to.throw(/--esn was given an empty value/);
            expect(() => resolveCliDevice({ instanceUrl: '' }, {}, env)).to.throw(/--instance-url was given an empty value/);
            expect(() => resolveCliDevice({ host: '' }, {}, env)).to.throw(/--host was given an empty value/);
        });

        it('treats an empty token as absent', () => {
            expect(resolveCliDevice({ esn: 'ESN1', token: '' }, {}, { ROKU_RCE_TOKEN: 'env-token' }).device).to.eql({ esn: 'ESN1', rceToken: 'env-token' });
            expect(() => resolveCliDevice({ esn: 'ESN1', token: '' }, {}, {})).to.throw(/ROKU_RCE_TOKEN/);
            expect(resolveCliDevice({ host: '1.1.1.1', token: '' }, {}, {}).device).to.eql({ host: '1.1.1.1' });
        });

        it('rejects repeated flags', () => {
            expect(() => resolveCliDevice({ esn: ['A', 'B'] as any }, {}, {})).to.throw(/--esn was specified more than once/);
            expect(() => resolveCliDevice({ host: ['A', 'B'] as any }, {}, {})).to.throw(/--host was specified more than once/);
            expect(() => resolveCliDevice({ instanceUrl: ['A', 'B'] as any }, {}, {})).to.throw(/--instance-url was specified more than once/);
            expect(() => resolveCliDevice({ esn: 'A', token: ['x', 'y'] as any }, {}, {})).to.throw(/--token was specified more than once/);
        });
    });
});
