/**
 * @overview Remove everything in a file except JSDoc-style comments. By enabling this plugin, you
 * can document source files that are not valid JavaScript (including source files for other
 * languages).
 * @module plugins/commentsOnly
 * @author Jeff Williams <jeffrey.l.williams@gmail.com>
 */
'use strict';

exports.handlers = {
    beforeParse: function(e) {
        // Remove any leading Brightscript comment
        var source = e.source.replace(/[ \t]*('|REM)[ \t]+?(\/?\*.*)/g,'$2');
        // a JSDoc comment looks like: /**[one or more chars]*/
        var comments = source.match(/\/\*\*[\s\S]+?\*\//g);
        if (comments) {
            e.source = comments.join('\n\n');
        } else {
            e.source = ''; // If file has no comments, parser should still receive no code
        }
    }
};
