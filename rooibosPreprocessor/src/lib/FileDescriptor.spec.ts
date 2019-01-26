import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';

import { FileType } from './FileType';

describe('File Descriptor', function() {
  describe('Initialization', function() {
    it('correctly sets directory', function() {
      const file = new FileDescriptor('/source', 'test.xml', '.xml');
      expect(file.filename).to.equal('test.xml');
    });

    it('correctly sets directory', function() {
      const file = new FileDescriptor('/source', 'test.xml', '.xml');
      expect(file.directory).to.equal('/source');

    });

    it('correctly sets extension', function() {
      const file = new FileDescriptor('/source', 'test.xml', '.xml');
      expect(file.extension).to.equal('.xml');

    });

    it('correctly gets fullpath', function() {
      const file = new FileDescriptor('/source', 'test.xml', '.xml');
      expect(file.fullPath).to.equal('/source/test.xml');

    });
  });

  describe('file types', function() {
    it('correctly identifies type other', function() {
      const file = new FileDescriptor('/source', 'test.json', '.json');
      expect(file.fileType).to.equal(FileType.Other);

    });

    it('correctly identifies type xml', function() {
      const file = new FileDescriptor('/source', 'test.xml', '.xml');
      expect(file.fileType).to.equal(FileType.Other);

    });

    it('correctly identifies type brs', function() {
      const file = new FileDescriptor('/source', 'test.brs', '.brs');
      expect(file.fileType).to.equal(FileType.Brs);

    });

    it('correctly identifies type other - no extension', function() {
      const file = new FileDescriptor('/source', 'test', '');
      expect(file.fileType).to.equal(FileType.Other);
    });
  });

  describe('getPackagePath', function() {
    it(`get's correct package paths`, function() {
      let testParams = [
        { path: 'build/source', rootPath: 'build', expected: 'pkg:/source/test.brs' },
        { path: '/build/source', rootPath: 'build', expected: 'pkg:/source/test.brs' },
        { path: '/project/build/development/source', rootPath: 'project/build/development', expected: 'pkg:/source/test.brs' }
      ];
      testParams.forEach( (param) => {
        const file = new FileDescriptor(param.path, 'test.brs', '.brs');
        expect(file.getPackagePath(param.rootPath)).to.equal('pkg:/source/test.brs');
      });
    });
  });
});
