' /**
'  * @module TestSuite
'  * @description All brs files that include `'@TestSuite` annotations automatically extend the TestSuite.
'  * The base test suite contains all of the assertions, and utility methods required to writey our tests, as well as being responsible for tracking the state of the tests and groups.
'  */
function __Rooibos_TestGroup_builder()
    instance = {}
    'test state
    instance.new = function(testSuite, data)
        m.name = "Unnamed Suite"
        m.testSuite = invalid
        m.setupFunctionName = invalid
        m.tearDownFunctionName = invalid
        m.beforeEachFunctionName = invalid
        m.afterEachFunctionName = invalid
        m.isSolo = false
        m.isLegacy = false
        m.isIgnored = false
        m.stats = invalid
        m.tests = []
        m.testSuite = testSuite
        m.name = data.name
        m.valid = data.valid
        m.hasFailures = testSuite.hasFailures
        m.isSolo = data.isSolo
        m.isIgnored = data.isIgnored
        m.testsData = data.testCases
        m.isNodeTest = false
        m.nodeName = invalid
        m.setupFunctionName = data.setupFunctionName
        m.tearDownFunctionName = data.tearDownFunctionName
        m.beforeEachFunctionName = data.beforeEachFunctionName
        m.afterEachFunctionName = data.afterEachFunctionName
        m.global = testSuite.global
        m.top = testSuite.top
        m.stats = Rooibos_Stats()
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ running
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    instance.run = function()
        m.runSuiteFunction(m.setupFunctionName, "setup")
        for each testData in m.testsData
            test = Rooibos_Test(m, testData)
            m.tests.push(test)
            m.runSuiteFunction(m.beforeEachFunctionName, "beforeEach")
            m.testSuite.runTest(test)
            m.stats.appendTestResult(test.result)
            m.runSuiteFunction(m.afterEachFunctionName, "afterEach")
            if m.stats.hasFailures and m.testSuite.isFailingFast then
                print "Terminating group due to failed test"
                exit for
            end if
        end for
        m.runSuiteFunction(m.tearDownFunctionName, "tearDown")
    end function
    instance.runSuiteFunction = function(methodName, defaultMethodName)
        if methodName <> invalid and methodName <> "" then
            m.testSuite[methodName]()
        else
            m.testSuite[defaultMethodName]()
        end if
    end function
    return instance
end function
function Rooibos_TestGroup(testSuite, data)
    instance = __Rooibos_TestGroup_builder()
    instance.new(testSuite, data)
    return instance
end function