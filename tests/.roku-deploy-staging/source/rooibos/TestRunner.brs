' /**
'  * @module TestRunner
'  */
' /**
'  * @memberof module:TestRunner
'  * @name Rooibos_TestRunner
'  * @function
'  * @description Creates an instance of the test runner
'  */
function __Rooibos_TestRunner_builder()
    instance = {}
    instance.new = function(testScene, nodeContext)
        m.testScene = invalid
        m.testReporter = invalid
        m.nodeContext = invalid
        m.config = invalid
        m.testSuites = []
        m.testScene = testScene
        if nodeContext.top = invalid then
            nodeContext.top = testScene
        end if
        m.nodeContext = nodeContext
        m.stats = Rooibos_Stats()
        m.runtimeConfig = Rooibos_RuntimeConfig()
        m.config = m.runtimeConfig.getRuntimeConfig()
        'TODO - allow providing different reporters via config
        m.testReporter = Rooibos_ConsoleTestReporter(m)
    end function
    ' /**
    '  * @memberof module:TestRunner
    '  * @name Run
    '  * @function
    '  * @instance
    '  * @description Executes all tests for a project, as per the config
    '  */
    instance.run = function()
        timer = createObject("roTimespan")
        timer.mark()
        suiteNames = m.runtimeConfig.getAllTestSuitesNames()
        includedSuites = []
        for each name in suiteNames
            suiteClass = m.runtimeConfig.getTestSuiteClassWithName(name)
            testSuite = invalid
            if suiteClass <> invalid then
                testSuite = suiteClass()
                testSuite.global = m.nodeContext.global
                testSuite.context = m.nodeContext
                testSuite.top = m.nodeContext.top
                m.runTestSuite(testSuite)
                if m.stats.hasFailures = true and m.config.failFast = true then
                    exit for
                end if
            else
                print "ERROR! coudl not create test for suite : " ; name
            end if
        end for
        m.stats.time = timer.totalMilliseconds()
        m.testReporter.reportResults(m.stats)
        'code coverage is not enabled in rooibos 4.0.0 - will get added again in future
        ' if Rooibos.Common.isFunction(RBS_reportCodeCoverage)
        '   'bs:disable-next-line
        '   RBS_reportCodeCoverage()
        '   if m.config.printLcov = true
        '     Coverage.printLCovInfo()
        '   end if
        ' end if
        m.sendHomeKeypress()
    end function
    instance.runInNodeMode = function(nodeTestName)
        suiteClass = m.getTestSuiteClassWithName(nodeTestName)
        testSuite = invalid
        if suiteClass <> invalid then
            testSuite = suiteClass(m.top)
        end if
        if testSuite <> invalid then
            testSuite.run()
            return {
                stats: testSuite.stats,
                tests: testSuite.tests
            }
        else
            print "[ERROR] could not create test suite " ; nodeTestName
        end if
        print "ERROR! executing node test " + nodeTestName + " was unsuccesful."
        return invalid
    end function
    instance.runTestSuite = function(testSuite) as void
        print ""
        print Rooibos_Common_fillText("> SUITE: " + testSuite.name, ">", 80)
        m.testSuites.push(testSuite)
        if testSuite.isNodeTest then
            m.runNodeTest(testSuite)
        else
            testSuite.run()
        end if
        m.stats.merge(testSuite.stats)
    end function
    instance.runNodeTest = function(testSuite) as void
        if testSuite.generatedNodeName <> "" then
            print " +++++RUNNING NODE TEST"
            print " node type is " ; testSuite.generatedNodeName
            node = m.testScene.createChild(testSuite.generatedNodeName)
            if type(node) = "roSGNode" then
                nodeResults = node.rooibosTestResult
                if nodeResults <> invalid then
                    testSuite.stats = nodeResults.stats
                    testSuite.testCases = nodeResults.testCases
                else
                    print " ERROR! The node test" ; testSuite.name ; " did not return a result from from the rooibos_runNodeTestSuite method. This usually means you are not importing rooibos.brs and the required test file. Please refer to : https://github.com/georgejecook/rooibos/blob/master/docs/index.md#testing-scenegraph-nodes"
                end if
                m.testScene.removeChild(node)
                return
            else
                print " ERROR!! - could not create node required to execute tests for " ; testSuite.name
                print " Node of type " ; testSuite.generatedNodeName ; " was not found/could not be instantiated"
            end if
        else
            print " ERROR!! - could not create node required to execute tests for " ; testSuite.name
            print " No node type was provided"
        end if
        testSuite.stats.hasFailures = true
        testSuite.failedCount += testSuite.testsData.count()
    end function
    instance.sendHomeKeypress = function()
        ut = createObject("roUrlTransfer")
        ut.SetUrl("http://localhost:8060/keypress/Home")
        ut.PostFromString("")
    end function
    return instance
end function
function Rooibos_TestRunner(testScene, nodeContext)
    instance = __Rooibos_TestRunner_builder()
    instance.new(testScene, nodeContext)
    return instance
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ This code is called inside of the node
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function Rooibos_createTestNode(nodeType) as object
    node = createObject("roSGNode", nodeType)
    if type(node) = "roSGNode" and node.subType() = nodeType then
        m.top.AppendChild(node)
        return node
    else
        print " Error creating test node of type " ; nodeType
        return invalid
    end if
end function

function Rooibos_runNodeTestSuite(name)
    nodeRunner = Rooibos_TestRunner(m.top.getScene(), m)
    return nodeRunner.runInNodeMode(name)
end function