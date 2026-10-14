import { expect } from 'chai';
import { Range, util } from 'brighterscript';
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
            srcPath: '/project/source/file.spec.bs',
            program: {
                diagnostics: {
                    register: (diagnostic: any) => collected.push(diagnostic)
                }
            }
        };
        statement = { location: { range: Range.create(4, 2, 4, 10) }, tokens: { name: { text: 'foo' } } };
        annotation = { location: { range: Range.create(2, 0, 2, 20) } };
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
        Diagnostics.diagnosticSlowAnnotationRequiresNumber(file, annotation);

        // 2210 and 2221 (no staging dir, which bsc v1 no longer needs) are retired; everything else from 2200-2222 must be present exactly once
        expect(collected.map(d => d.code)).to.eql([
            'RBS2200', 'RBS2201', 'RBS2202', 'RBS2203', 'RBS2204', 'RBS2205',
            'RBS2206', 'RBS2207', 'RBS2208', 'RBS2209', 'RBS2211', 'RBS2212',
            'RBS2213', 'RBS2214', 'RBS2215', 'RBS2216', 'RBS2217', 'RBS2218',
            'RBS2219', 'RBS2220', 'RBS2222'
        ]);
    });

    it('anchors statement diagnostics to the statement start line', () => {
        Diagnostics.diagnosticWrongAnnotation(file, statement, '');
        expect(collected[0].location.range.start.line).to.equal(4);
        expect(collected[0].location.range.start.character).to.equal(2);
        expect(collected[0].location.uri).to.equal(util.pathToUri(file.srcPath));
    });

    it('anchors annotation diagnostics to the annotation range', () => {
        Diagnostics.diagnosticIllegalParams(file, annotation);
        expect(collected[0].location.range.start.line).to.equal(2);
        expect(collected[0].location.range.end.line).to.equal(2);
    });
});
