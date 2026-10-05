import { expect } from 'chai';
import { RooibosPlugin } from '../../plugin';
import { normalizeCodeCoverage, resolveCliRooibosConfig } from './RooibosConfig';

describe('RooibosConfig code coverage resolution', () => {
    let warnings: string[];
    let originalWarn: typeof console.warn;

    beforeEach(() => {
        warnings = [];
        originalWarn = console.warn;
        console.warn = (message: string) => {
            warnings.push(message);
        };
    });

    afterEach(() => {
        console.warn = originalWarn;
    });

    describe('normalizeCodeCoverage', () => {
        it('uses codeCoverage without warning', () => {
            expect(normalizeCodeCoverage({ codeCoverage: true }).codeCoverage).to.be.true;
            expect(warnings).to.be.empty;
        });

        it('honours the deprecated isRecordingCodeCoverage with a warning', () => {
            const config = normalizeCodeCoverage({ isRecordingCodeCoverage: true });
            expect(config.codeCoverage).to.be.true;
            expect(config.isRecordingCodeCoverage).to.be.undefined;
            expect(warnings).to.eql(['rooibos: `isRecordingCodeCoverage` is deprecated, use `codeCoverage` instead']);
        });

        it('prefers codeCoverage when both differ and says so', () => {
            const config = normalizeCodeCoverage({ codeCoverage: false, isRecordingCodeCoverage: true });
            expect(config.codeCoverage).to.be.false;
            expect(warnings).to.have.length(1);
            expect(warnings[0]).to.include('deprecated').and.to.include('`codeCoverage` is being used');
        });

        it('defaults to false', () => {
            expect(normalizeCodeCoverage({}).codeCoverage).to.be.false;
            expect(warnings).to.be.empty;
        });
    });

    describe('resolveCliRooibosConfig', () => {
        it('returns undefined with no rooibos block and no overrides', () => {
            expect(resolveCliRooibosConfig(undefined)).to.be.undefined;
            expect(resolveCliRooibosConfig(undefined, {})).to.be.undefined;
        });

        it('ignores overrides whose value is undefined', () => {
            expect(resolveCliRooibosConfig(undefined, { codeCoverage: undefined })).to.be.undefined;
            const resolved = resolveCliRooibosConfig({ codeCoverage: true }, { codeCoverage: undefined });
            expect(resolved.codeCoverage).to.be.true;
        });

        it('lets codeCoverage true override a bsconfig false', () => {
            const resolved = resolveCliRooibosConfig({ codeCoverage: false }, { codeCoverage: true });
            expect(resolved.codeCoverage).to.be.true;
        });

        it('lets codeCoverage false override a bsconfig true', () => {
            const resolved = resolveCliRooibosConfig({ codeCoverage: true }, { codeCoverage: false });
            expect(resolved.codeCoverage).to.be.false;
        });

        it('creates a config when only an override is given', () => {
            expect(resolveCliRooibosConfig(undefined, { codeCoverage: true }).codeCoverage).to.be.true;
        });

        it('lets an override win over a legacy bsconfig key and still warns', () => {
            const resolved = resolveCliRooibosConfig({ isRecordingCodeCoverage: true }, { codeCoverage: false });
            expect(resolved.codeCoverage).to.be.false;
            expect(resolved.isRecordingCodeCoverage).to.be.undefined;
            expect(warnings).to.have.length(1);
            expect(warnings[0]).to.include('deprecated');
        });

        it('resolves a legacy key from the bsconfig with a warning', () => {
            const resolved = resolveCliRooibosConfig({ isRecordingCodeCoverage: true });
            expect(resolved.codeCoverage).to.be.true;
            expect(warnings).to.have.length(1);
        });

        it('preserves other rooibos keys', () => {
            const resolved = resolveCliRooibosConfig({ failFast: true, showOnlyFailures: true }, { codeCoverage: true });
            expect(resolved).to.include({ codeCoverage: true, failFast: true, showOnlyFailures: true });
        });

        it('does not mutate the input object', () => {
            const original = { codeCoverage: false, isRecordingCodeCoverage: true, failFast: true };
            resolveCliRooibosConfig(original, { codeCoverage: true });
            expect(original).to.eql({ codeCoverage: false, isRecordingCodeCoverage: true, failFast: true });
        });
    });

    describe('plugin getConfig', () => {
        it('normalizes the deprecated option', () => {
            const config = (new RooibosPlugin() as any).getConfig({ isRecordingCodeCoverage: true });
            expect(config.codeCoverage).to.be.true;
            expect(warnings).to.have.length(1);
        });
    });
});
