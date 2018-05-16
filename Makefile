
.PHONY: test dist doc

# Run the tests
test: dist
	@rm -rf build/*
	mkdir -p build
	cp -r test/* build
	cp dist/rooibos.cat.brs build/source
	cd build; ${MAKE} install

# Smash the library down to one file
BLANK_LINES_RE="/^[ \t]*'.*/d"
COMMENT_LINES_RE="/^[ ]*$$/d"
LEADING_WHITESPACE_RE="s/^[ \t]*//"
dist:
	sed "s/^/' VERSION: Rooibos /g" ./VERSION > ./dist/rooibos.cat.brs
	sed "s/^/' LICENSE: /g" ./LICENSE >> ./dist/rooibos.cat.brs
	#LEADING_WHITESPACE_RE is chopping off t's for the time being. need to fix it
	#cd src && ls | xargs -J % sed -E -e ${COMMENT_LINES_RE} -e ${BLANK_LINES_RE} -e ${LEADING_WHITESPACE_RE} % >> ../dist/rooibos.cat.brs
	cd src && ls | xargs -J % sed -E -e ${COMMENT_LINES_RE} -e ${BLANK_LINES_RE} % >> ../dist/rooibos.cat.brs

doc:
	cd jsdoc && npm install
	./jsdoc/node_modules/.bin/jsdoc -c jsdoc/jsdoc.json -t jsdoc/node_modules/ink-docstrap/template -d apiDocs
