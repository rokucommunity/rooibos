APPNAME = Rooibos
VERSION = 0.1.0

.PHONY: test dist doc

include app.mk

DISTDIR = ./dist

dist:
	@if [ ! -d $(DISTDIR) ]; \
	then \
		mkdir -p $(DISTDIR); \
	fi

	sed "s/^/' VERSION: Rooibos /g" ./VERSION > $(DISTDIR)/rooibos.cat.brs
	sed "s/^/' LICENSE: /g" ./LICENSE >> $(DISTDIR)/rooibos.cat.brs

	cd src && ls | xargs cat >> ../$(DISTDIR)/rooibos.cat.brs
	cp $(DISTDIR)/rooibos.cat.brs source
	cp $(DISTDIR)/rooibos.cat.brs samples/Overview/source
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
