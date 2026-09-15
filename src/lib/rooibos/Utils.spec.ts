import { expect } from 'chai';
import type { DottedGetExpression, FunctionStatement } from 'brighterscript';
import { Parser } from 'brighterscript';
import { functionRequiresReturnValue, getAllDottedGetParts, getPathValuePartAsString, getRootObjectFromDottedGet, getStringPathFromDottedGet, sanitizeBsJsonString } from './Utils';

function parseExpression<T = DottedGetExpression>(text: string): T {
    const { statements } = Parser.parse(`value = ${text}`);
    return (statements[0] as any).value as T;
}

function parseFunction(text: string): FunctionStatement {
    return Parser.parse(text).ast.statements[0] as FunctionStatement;
}

describe('Utils', () => {
    describe('sanitizeBsJsonString', () => {
        it('swaps double quotes for single quotes and wraps the text', () => {
            expect(sanitizeBsJsonString('say "hi"')).to.equal(`"say 'hi'"`);
        });

        it('handles empty and undefined text', () => {
            expect(sanitizeBsJsonString('')).to.equal('""');
            expect(sanitizeBsJsonString(undefined as any)).to.equal('""');
        });
    });

    describe('functionRequiresReturnValue', () => {
        it('is true for a function with a return type', () => {
            expect(functionRequiresReturnValue(parseFunction('function foo() as string\nreturn "x"\nend function'))).to.be.true;
        });

        it('is false for a sub', () => {
            expect(functionRequiresReturnValue(parseFunction('sub foo()\nend sub'))).to.be.false;
        });

        it('is false for a void function', () => {
            expect(functionRequiresReturnValue(parseFunction('function foo() as void\nend function'))).to.be.false;
        });
    });

    describe('getAllDottedGetParts', () => {
        it('returns the parts in source order', () => {
            expect(getAllDottedGetParts(parseExpression('alpha.beta.gamma'))).to.eql(['alpha', 'beta', 'gamma']);
        });
    });

    describe('getRootObjectFromDottedGet', () => {
        it('walks to the root variable of a dotted chain', () => {
            const root = getRootObjectFromDottedGet(parseExpression('alpha.beta.gamma'));
            expect((root).name.text).to.equal('alpha');
        });

        it('returns a non-dotted expression unchanged', () => {
            const variable = parseExpression('alpha');
            expect(getRootObjectFromDottedGet(variable)).to.equal(variable);
        });
    });

    describe('getStringPathFromDottedGet', () => {
        it('builds a string literal for a plain dotted path', () => {
            const literal = getStringPathFromDottedGet(parseExpression('alpha.beta.gamma'));
            expect(literal.token.text).to.equal('"alpha.beta.gamma"');
        });

        it('returns undefined when the chain contains a call', () => {
            expect(getStringPathFromDottedGet(parseExpression('alpha.beta().gamma'))).to.be.undefined;
        });

        it('uses the literal key of an indexed get', () => {
            const literal = getStringPathFromDottedGet(parseExpression('alpha["key"].gamma'));
            expect(literal.token.text).to.equal('"alpha.key.gamma"');
        });

        it('uses the variable name of an indexed get', () => {
            const literal = getStringPathFromDottedGet(parseExpression('alpha[key].gamma'));
            expect(literal.token.text).to.equal('"alpha.key.gamma"');
        });
    });

    describe('getPathValuePartAsString', () => {
        it('returns undefined for calls and missing expressions', () => {
            expect(getPathValuePartAsString(parseExpression('foo()'))).to.be.undefined;
            expect(getPathValuePartAsString(undefined as any)).to.be.undefined;
        });

        it('returns undefined for expressions that are not part of a path', () => {
            expect(getPathValuePartAsString(parseExpression('1'))).to.be.undefined;
        });
    });
});
