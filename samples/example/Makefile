#########################################################################
# Makefile Usage:
# > make test ' run all tests
# > make testFailures ' run all tests and show only failures
#
# 1) Make sure that you have the curl command line executable in your path
# 2) Set the variable ROKU_DEV_TARGET in your environment to the IP
#    address of your Roku box. (e.g. export ROKU_DEV_TARGET=192.168.1.1.
#    Set in your this variable in your shell startup (e.g. .bashrc)
# 3) and set up the DEVPASSWORD environment variable, too
##########################################################################

APPNAME = RooibosExampleApp
VERSION = 0.1.0
ROKU_TEST_ID = 1
ROKU_TEST_WAIT_DURATION = 5

ZIP_EXCLUDE= -x xml/* -x artwork/* -x \*.pkg -x storeassets\* -x keys\* -x \*/.\* -x *.git* -x *.DS* -x *.pkg* -x dist/**\*  -x out/**\* -x node_modules/**\* -x node_modules 

include app.mk

test: remove install
	echo "Running tests"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home" 
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&logLevel=4"
	sleep 10 | telnet ${ROKU_DEV_TARGET} 8085

testFailures: remove install
	echo "Running tests - only showing failures"
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home" 
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&showOnlyFailures=true&logLevel=4"
	sleep 10 | telnet ${ROKU_DEV_TARGET} 8085

continuousIntegration: remove install
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/keypress/home" 
	curl -d '' "http://${ROKU_DEV_TARGET}:8060/launch/dev?RunTests=true&testId=${ROKU_TEST_ID}"

	-sleep ${ROKU_TEST_WAIT_DURATION} | telnet ${ROKU_DEV_TARGET} 8085 | tee dist/test.log
	
	if tail -2 dist/test.log | head | grep -q "RESULT: Success"; then echo "SUCCESS"; else exit -1; fi
	
