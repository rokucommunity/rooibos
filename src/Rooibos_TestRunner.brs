' /**
'  * @module TestRunner
'  */

' /**
'  * @memberof module:TestRunner
'  * @name RBS_TR_TestRunner
'  * @function
'  * @description Creates an instance of the test runner
'  * @param {Dynamic} args - contains the application launch args, and other settings required for test execution
'  * @returns {Object} TestRunner
'  */

function RBS_TR_TestRunner(args = {}) as object
  this = {}
  this.testScene = args.testScene
  this.nodeContext = args.nodeContext

  config = RBSFM_getRuntimeConfig()
  if (config = invalid or not RBS_CMN_IsAssociativeArray(config))
    ? "WARNING : specified config is invalid - using default"
    config = {
      showOnlyFailures: false
      failFast: false
    }
  end if

  'mix in parsed in args
  if (args.showOnlyFailures <> invalid)
    config.showOnlyFailures = args.showOnlyFailures = "true"
  end if

  if (args.failFast <> invalid)
    config.failFast = args.failFast = "true"
  end if

  this.testUtilsDecoratorMethodName = args.testUtilsDecoratorMethodName
  this.config = config

  ' Internal properties
  this.config.testsDirectory = config.testsDirectory

  this.logger = Logger(this.config)
  this.global = args.global

  ' Interface
  this.Run          = RBS_TR_Run

  return this
end function

' /**
'  * @memberof module:TestRunner
'  * @name Run
'  * @function
'  * @instance
'  * @description Executes all tests for a project, as per the config
'  */
sub RBS_TR_Run()
  if type(RBSFM_getTestSuitesForProject) <> "Function"
    ? " ERROR! RBSFM_getTestSuitesForProject is not found! That looks like you didn't run the preprocessor as part of your test process. Please refer to the docs."
    return
  end if

  totalStatObj = RBS_STATS_CreateTotalStatistic()
  m.runtimeConfig = UnitTestRuntimeConfig()
  m.runtimeConfig.global = m.global
  totalStatObj.testRunHasFailures = false

  for each metaTestSuite in m.runtimeConfig.suites
    if (m.runtimeConfig.hasSoloTests = true)
      if (metaTestSuite.hasSoloTests <> true)
        if (m.config.logLevel = 2)
          ? "TestSuite " ; metaTestSuite.name ; " Is filtered because it has no solo tests"
        end if
        goto skipSuite
      end if
    else if (m.runtimeConfig.hasSoloSuites)
      if (metaTestSuite.isSolo <> true)
        if (m.config.logLevel = 2)
          ? "TestSuite " ; metaTestSuite.name ; " Is filtered due to solo flag"
        end if
        goto skipSuite
      end if
    end if

    if (metaTestSuite.isIgnored = true)
      if (m.config.logLevel = 2)
        ? "Ignoring TestSuite " ; metaTestSuite.name ; " Due to Ignore flag"
      end if
      totalstatobj.ignored ++
      totalStatObj.IgnoredTestNames.push("|-" + metaTestSuite.name + " [WHOLE SUITE]")

      goto skipSuite
    end if

    if (metaTestSuite.isNodeTest = true and metaTestSuite.nodeTestFileName <> "")
      ? " +++++RUNNING NODE TEST"
      nodeType = metaTestSuite.nodeTestFileName
      ? " node type is " ; nodeType

      node = m.testScene.CallFunc("Rooibos_CreateTestNode", nodeType)

      if (type(node) = "roSGNode" and node.subType() = nodeType)
        args = {
          "metaTestSuite": metaTestSuite
          "testUtilsDecoratorMethodName": m.testUtilsDecoratorMethodName
          "config": m.config
          "runtimeConfig": m.runtimeConfig
        }
        nodeStatResults = node.callFunc("Rooibos_RunNodeTests", args)
        RBS_STATS_MergeTotalStatistic(totalStatObj, nodeStatResults)

        m.testScene.RemoveChild(node)

      else
        ? " ERROR!! - could not create node required to execute tests for " ; metaTestSuite.name
        ? " Node of type " ; nodeType ; " was not found/could not be instantiated"
      end if
    else
      if (metaTestSuite.hasIgnoredTests)
        totalStatObj.IgnoredTestNames.push("|-" + metaTestSuite.name)
      end if
      RBS_RT_RunItGroups(metaTestSuite, totalStatObj, m.testUtilsDecoratorMethodName, m.config, m.runtimeConfig, m.nodeContext)
    end if
    skipSuite:
  end for
  m.logger.PrintStatistic(totalStatObj)

  if RBS_CMN_IsFunction(RBS_ReportCodeCoverage)
    RBS_ReportCodeCoverage()
  end if
  RBS_TR_SendHomeKeypress()
end sub

sub RBS_RT_RunItGroups(metaTestSuite, totalStatObj, testUtilsDecoratorMethodName, config, runtimeConfig, nodeContext = invalid)
  if (testUtilsDecoratorMethodName <> invalid)
    testUtilsDecorator = RBS_CMN_GetFunctionBruteForce(testUtilsDecoratorMethodName)
    if (not RBS_CMN_IsFunction(testUtilsDecorator))
      ? "[ERROR] Test utils decorator method `" ; testUtilsDecoratorMethodName ;"` was not in scope! for testSuite: " + metaTestSuite.name
    end if
  end if

  for each itGroup in metaTestSuite.itGroups
    testSuite = RBS_ItG_GetRunnableTestSuite(itGroup)
    if (nodeContext <> invalid)
      testSuite.node = nodeContext
      testSuite.global = nodeContext.global
      testSuite.top = nodeContext.top
    end if

    if (RBS_CMN_IsFunction(testUtilsDecorator))
      testUtilsDecorator(testSuite)
    end if

    totalStatObj.Ignored += itGroup.ignoredTestCases.count()

    if (itGroup.isIgnored = true)
      if (config.logLevel = 2)
        ? "Ignoring itGroup " ; itGroup.name ; " Due to Ignore flag"
      end if
      totalStatObj.ignored += itGroup.testCases.count()
      totalStatObj.IgnoredTestNames.push("  |-" + itGroup.name + " [WHOLE GROUP]")
      goto skipItGroup
    else
      if (itGroup.ignoredTestCases.count() > 0)
        totalStatObj.IgnoredTestNames.push("  |-" + itGroup.name)
        totalStatObj.ignored += itGroup.ignoredTestCases.count()
        for each testCase in itGroup.ignoredTestCases
          if (testcase.isParamTest <> true)
            totalStatObj.IgnoredTestNames.push("  | |--" + testCase.name)
          else if (testcase.paramTestIndex = 0)
            testCaseName = testCase.Name
            if (len(testCaseName) > 1 and right(testCaseName, 1) = "0")
              testCaseName = left(testCaseName, len(testCaseName) - 1)
            end if
            totalStatObj.IgnoredTestNames.push("  | |--" + testCaseName)
          end if
        end for
      end if
    end if

    if (runtimeConfig.hasSoloTests)
      if (itGroup.hasSoloTests <> true)
        if (config.logLevel = 2)
          ? "Ignoring itGroup " ; itGroup.name ; " Because it has no solo tests"
        end if
        goto skipItGroup
      end if
    else if (runtimeConfig.hasSoloGroups)
      if (itGroup.isSolo <> true)
        goto skipItGroup
      end if
    end if

    if (testSuite.testCases.Count() = 0)
      if (config.logLevel = 2)
        ? "Ignoring TestSuite " ; itGroup.name ; " - NO TEST CASES"
      end if
      goto skipItGroup
    end if

    if RBS_CMN_IsFunction(testSuite.SetUp)
      testSuite.SetUp()
    end if

    RBS_RT_RunTestCases(metaTestSuite, itGroup, testSuite, totalStatObj, config, runtimeConfig)

    if RBS_CMN_IsFunction(testSuite.TearDown)
      testSuite.TearDown()
    end if

    if (totalStatObj.testRunHasFailures = true and config.failFast = true)
      exit for
    end if
    skipItGroup:
  end for
end sub

sub RBS_RT_RunTestCases(metaTestSuite, itGroup, testSuite, totalStatObj, config, runtimeConfig)
  suiteStatObj = RBS_STATS_CreateSuiteStatistic(itGroup.Name)
  testSuite.global = runtimeConfig.global

  for each testCase in testSuite.testCases
    metaTestCase = itGroup.testCaseLookup[testCase.Name]
    metaTestCase.time = 0
    if (runtimeConfig.hasSoloTests and not metaTestCase.isSolo)
      goto skipTestCase
    end if

    if RBS_CMN_IsFunction(testSuite.beforeEach)
      testSuite.beforeEach()
    end if

    testTimer = CreateObject("roTimespan")
    testCaseTimer = CreateObject("roTimespan")
    testStatObj = RBS_STATS_CreateTestStatistic(testCase.Name)
    testSuite.testCase = testCase.Func
    testStatObj.filePath = metaTestSuite.filePath
    testStatObj.metaTestCase = metaTestCase
    testSuite.currentResult = UnitTestResult()

    testStatObj.metaTestCase.testResult = testSuite.currentResult

    if (metaTestCase.isParamsValid)
      if (metaTestCase.isParamTest)
        testCaseParams = []
        for paramIndex = 0 to metaTestCase.rawParams.count()
          paramValue = metaTestCase.rawParams[paramIndex]
          if type(paramValue) = "roString" and len(paramValue) >= 8 and left(paramValue, 8) = "#RBSNode"
            nodeType = "ContentNode"
            paramDirectiveArgs = paramValue.split("|")
            if paramDirectiveArgs.count() > 1
              nodeType = paramDirectiveArgs[1]
            end if
            paramValue = createObject("roSGNode", nodeType)
          end if
          testCaseParams.push(paramValue)
        end for
        testCaseTimer.mark()
        'up to 6 param args supported for now
        if (metaTestCase.expectedNumberOfParams = 1)
          testSuite.testCase(testCaseParams[0])
        else if (metaTestCase.expectedNumberOfParams = 2)
          testSuite.testCase(testCaseParams[0], testCaseParams[1])
        else if (metaTestCase.expectedNumberOfParams = 3)
          testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2])
        else if (metaTestCase.expectedNumberOfParams = 4)
          testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3])
        else if (metaTestCase.expectedNumberOfParams = 5)
          testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4])
        else if (metaTestCase.expectedNumberOfParams = 6)
          testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5])
        end if
        metaTestCase.time = testCaseTimer.totalMilliseconds()
      else
        testCaseTimer.mark()
        testSuite.testCase()
        metaTestCase.time = testCaseTimer.totalMilliseconds()
      end if
    else
      testSuite.Fail("Could not parse args for test ")
    end if
    if testSuite.isAutoAssertingMocks = true
      testSuite.AssertMocks()
      testSuite.CleanMocks()
      testSuite.CleanStubs()
    end if
    runResult = testSuite.currentResult.GetResult()


    if runResult <> ""
      testStatObj.Result      = "Fail"
      testStatObj.Error.Code    = 1
      testStatObj.Error.Message   = runResult
    else
      testStatObj.Result      = "Success"
    end if

    testStatObj.Time = testTimer.TotalMilliseconds()
    RBS_STATS_AppendTestStatistic(suiteStatObj, testStatObj)

    if RBS_CMN_IsFunction(testSuite.afterEach)
      testSuite.afterEach()
    end if

    if testStatObj.Result <> "Success"
      totalStatObj.testRunHasFailures = true
    end if

    if testStatObj.Result = "Fail" and config.failFast = true
      exit for
    end if
    skipTestCase:
  end for

  suiteStatObj.metaTestSuite = metaTestSuite
  RBS_STATS_AppendSuiteStatistic(totalStatObj, suiteStatObj)
end sub

sub RBS_TR_SendHomeKeypress()
  ut = CreateObject("roUrlTransfer")
  ut.SetUrl("http://localhost:8060/keypress/Home")
  ut.PostFromString("")
end sub

' /**
'  * @memberof module:TestRunner
'  * @name Rooibos_RunNodeTests
'  * @function
'  * @instance
'  * @description interface hook for exeucting tests on nodes. This method is for internal use only. Only the Rooibos framework should invoke this method
'  * @param {Dynamic} args - associated array, containing all the information required to execute the tests.
'  * @returns {Object} test stats object, for merging into main test stats
'  */
function Rooibos_RunNodeTests(args) as object
  ? " RUNNING NODE TESTS"
  totalStatObj = RBS_STATS_CreateTotalStatistic()

  RBS_RT_RunItGroups(args.metaTestSuite, totalStatObj, args.testUtilsDecoratorMethodName, args.config, args.runtimeConfig, m)
  return totalStatObj
end function

' /**
'  * @memberof module:TestRunner
'  * @name Rooibos_CreateTestNode
'  * @function
'  * @instance
'  * @description interface hook for correctly creating nodes that get tested. This ensures they are in the correct scope.
'  * This method must be defined in your tests scene xml.
'  * @param {String} nodeType - name of node to create. The framework will pass this in as required
'  * @returns {Object} the required node, or invalid if it could not be invoked.
'  */
function Rooibos_CreateTestNode(nodeType) as object
  node = createObject("roSGNode", nodeType)

  if (type(node) = "roSGNode" and node.subType() = nodeType)
    m.top.AppendChild(node)
    return node
  else
    ? " Error creating test node of type " ; nodeType
    return invalid
  end if
end function
