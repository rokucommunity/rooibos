import * as chai from 'chai';
const expect = chai.expect;
import type { TestCase } from './lib/rooibos/TestCase';


export const TestCaseMD5Sum = `0d635a9477c4624180ef87bef352afd3`;

const TestCaseFunctionNameRegex = new RegExp(`^rooiboos_test_case_${TestCaseMD5Sum}_`);

export function expectTestCaseFunctionName(testCase: TestCase, index: number) {
    expect(testCase.funcName).to.match(new RegExp(TestCaseFunctionNameRegex.source + index + '$'));
}
