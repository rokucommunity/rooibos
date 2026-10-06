import { expect } from 'chai';
import { Range } from 'brighterscript';
import * as Diagnostics from './Diagnostics';

describe('Diagnostics', () => {
    let collected: any[];
    let file: any;
    let statement: any;
    let annotation: any;
    let rooibosAnnotation: any;

    beforeEach(() => {
        collected = [];
        file = {
            addDiagnostics: (items: any[]) => collected.push(...items)
        };
        statement = { range: Range.create(4, 2, 4, 10), name: { text: 'foo' } };
        annotation = { range: Range.create(2, 0, 2, 20) };
        rooibosAnnotation = { name: 'my group', annotation: annotation, file: file };
    });

    it('emits one diagnostic per helper with the documented RBS code', () => {
        Diagnostics.diagnosticWrongAnnotation(file, statement, ' extra');
        Diagnostics.diagnosticNoGroup(file, statement, 'It' as any);
        Diagnostics.diagnosticWrongParameterCount(file, statement, 1);
        Diagnostics.diagnosticDuplicateSuite(file, statement, rooibosAnnotation);
        Diagnostics.diagnosticTestAnnotationOutsideOfGroup(file, statement, rooibosAnnotation);
        Diagnostics.diagnosticIllegalParams(file, annotation);
        Diagnostics.diagnosticWrongTestParameterCount(file, annotation, 1, 2);
        Diagnostics.diagnosticNodeTestRequiresNode(file, annotation);
        Diagnostics.diagnosticNodeTestIllegalNode(file, annotation, 'BadNode');
        Diagnostics.diagnosticGroupWithNameAlreadyDefined(file, rooibosAnnotation);
        Diagnostics.diagnosticIncompatibleAnnotation(rooibosAnnotation);
        Diagnostics.diagnosticErrorProcessingFile(file, 'boom');
        Diagnostics.diagnosticErrorNoMainFound(file);
        Diagnostics.diagnosticEmptyGroup(file, rooibosAnnotation);
        Diagnostics.diagnosticNoTestFunctionDefined(file, rooibosAnnotation);
        Diagnostics.diagnosticTestWithArgsButNoParams(file, annotation, 2);
        Diagnostics.diagnosticNoTestNameDefined(file, annotation);
        Diagnostics.diagnosticMultipleDescribeAnnotations(file, annotation);
        Diagnostics.diagnosticMultipleTestOnFunctionDefined(file, annotation);
        Diagnostics.diagnosticCorruptTestProduced(file, annotation, 'parse error', 'source text');
        Diagnostics.diagnosticNoStagingDir(file);
        Diagnostics.diagnosticSlowAnnotationRequiresNumber(file, annotation);

        // 2210 is retired; everything else from 2200-2222 must be present exactly once
        expect(collected.map(d => d.code)).to.eql([
            'RBS2200', 'RBS2201', 'RBS2202', 'RBS2203', 'RBS2204', 'RBS2205',
            'RBS2206', 'RBS2207', 'RBS2208', 'RBS2209', 'RBS2211', 'RBS2212',
            'RBS2213', 'RBS2214', 'RBS2215', 'RBS2216', 'RBS2217', 'RBS2218',
            'RBS2219', 'RBS2220', 'RBS2221', 'RBS2222'
        ]);
    });

    it('anchors statement diagnostics to the statement start line', () => {
        Diagnostics.diagnosticWrongAnnotation(file, statement, '');
        expect(collected[0].range.start.line).to.equal(4);
        expect(collected[0].range.start.character).to.equal(2);
        expect(collected[0].file).to.equal(file);
    });

    it('anchors annotation diagnostics to the annotation range', () => {
        Diagnostics.diagnosticIllegalParams(file, annotation);
        expect(collected[0].range.start.line).to.equal(2);
        expect(collected[0].range.end.line).to.equal(2);
    });
});
