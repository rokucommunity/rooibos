APPNAME = Rooibos
VERSION = 0.1.0
ROKU_TEST_ID = 1
ROKU_TEST_WAIT_DURATION = 5

ZIP_EXCLUDE= -x xml/* -x artwork/* -x \*.pkg -x storeassets\* -x keys\* -x \*/.\* -x *.git* -x *.DS* -x *.pkg* -x dist/**\*  -x out/**\* -x node_modules/**\* -x node_modules -x apiDocs/**\* -x docs/**\* -x jsdoc/**\* -x src/**\* -x samples/**\*

.PHONY: test dist doc

include app.mk

echo "wtf"
	
# Smash the library down to one file
BLANK_LINES_RE="/^[ \t]*'.*/d"
COMMENT_LINES_RE="/^[ ]*$$/d"
LEADING_WHITESPACE_RE="s/^[ \t]*//"
DISTDIR = ./dist

dist:
	@if [ ! -d $(DISTDIR) ]; \
	then \
		mkdir -p $(DISTDIR); \
	fi
	sed "s/^/' VERSION: Rooibos /g" ./VERSION > $(DISTDIR)/rooibos.cat.brs
	sed "s/^/' LICENSE: /g" ./LICENSE >> $(DISTDIR)/rooibos.cat.brs
	#LEADING_WHITESPACE_RE is chopping off t's for the time being. need to fix it
	#cd src && ls | xargs -J % sed -E -e ${COMMENT_LINES_RE} -e ${BLANK_LINES_RE} -e ${LEADING_WHITESPACE_RE} % >> ../dist/rooibos.cat.brs
	cd src && ls | xargs -J % sed -E -e ${COMMENT_LINES_RE} -e ${BLANK_LINES_RE} % >> ../$(DISTDIR)/rooibos.cat.brs
	cp $(DISTDIR)/rooibos.cat.brs source
	cp $(DISTDIR)/rooibos.cat.brs samples/Overview/source
	cp $(DISTDIR)/rooibos.cat.brs samples/nonEvalSample/source
doc:
	cd jsdoc && npm install
	./jsdoc/node_modules/.bin/jsdoc -c jsdoc/jsdoc.json -t jsdoc/node_modules/minami -d apiDocs

test: dist remove install
	echo "Running tests"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&logLevel=4"
	sleep 10 | telnet ${ROKU_DEV_TARGET} 8085

testFailures: remove install
	echo "Running tests - only showing failures"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&showOnlyFailures=true&logLevel=4"
	sleep 10 | telnet ${ROKU_DEV_TARGET} 8085
