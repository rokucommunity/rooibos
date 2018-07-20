function RBS_TR_TestRunner(args = {}) as Object
    this = {}

    defaultConfig = {
        logLevel : 1,
        testsDirectory: "pkg:/source/Tests", 
        testFilePrefix: "Test__",
        failFast: false,
        showOnlyFailures: false,
        maxLinesWithoutSuiteDirective: 100
    }
    
    if (args.testConfigPath <> invalid) 
        ? "Loading test config from " ; args.testConfigPath 
        rawConfig = ReadAsciiFile(args.testConfigPath)
    else
        ? "Loading test config from default location : pkg:/source/Tests/testconfig.json" 
        rawConfig = ReadAsciiFile("pkg:/source/Tests/testconfig.json")
    end if
    
    if (rawConfig <> invalid)
        config = ParseJson(rawConfig)
    end if
    
    if config = invalid
        config = defaultConfig    
    end if
    
    'mix in parsed in args
    if (args.showOnlyFailures <> invalid)
        config.showOnlyFailures = args.showOnlyFailures = "true"
    end if
    
    if (args.failFast <> invalid)
        config.failFast = args.failFast = "true"
    end if
    
    this.testUtilsDecorator = args.testUtilsDecorator
    this.config = config
    
    ' Internal properties
    this.config.testsDirectory = config.testsDirectory        

    this.logger = Logger(this.config)

    ' Interface
    this.Run                    = RBS_TR_Run

    return this
end function

'----------------------------------------------------------------
' Run main test loop.
'----------------------------------------------------------------
sub RBS_TR_Run()
    alltestCount = 0
    totalStatObj = m.logger.CreateTotalStatistic()
    m.runtimeConfig = UnitTestRuntimeConfig(m.config.testsDirectory, m.config.maxLinesWithoutSuiteDirective)
    totalStatObj.testRunHasFailures = false
    
    for each metaTestSuite in m.runtimeConfig.suites
        if (m.runtimeConfig.hasSoloTests )
            if (not metaTestSuite.hasSoloTests)
                if (m.config.logLevel = 2)
                    ? "TestSuite " ; metaTestSuite.name ; " Is filtered because it has no solo tests"
                end if 
                goto skipSuite
            end if
        else if (m.runtimeConfig.hasSoloSuites)
            if (not metaTestSuite.isSolo)
                if (m.config.logLevel = 2)
                    ? "TestSuite " ; metaTestSuite.name ; " Is filtered due to solo flag"
                end if
                goto skipSuite
            end if
        end if
        
        if (metaTestSuite.isIgnored)
            if (m.config.logLevel = 2)
                ? "Ignoring TestSuite " ; metaTestSuite.name ; " Due to Ignore flag"
            end if
            goto skipSuite
        end if
        
        '********************************************* 
        ' NOW PROCESSES EACH TEST SUITE AS A SERIES OF '@It tags, which in turn become test suites
        '********************************************* 
        for each itGroup in metaTestSuite.itGroups
            testSuite = RBS_ItG_GetRunnableTestSuite(itGroup)
            
            if (m.testUtilsDecorator <> invalid)
                m.testUtilsDecorator(testSuite)
            end if
            
            if (itGroup.isIgnored)
                if (m.config.logLevel = 2)
                    ? "Ignoring itGroup " ; itGroup.name ; " Due to Ignore flag"
                end if
                goto skipItGroup
            end if
            
            if (m.runtimeConfig.hasSoloTests)
                if (not itGroup.hasSoloTests)
                    if (m.config.logLevel = 2)
                        ? "Ignoring itGroup " ; itGroup.name ; " Because it has no solo tests"
                    end if
                    goto skipItGroup
                end if
            else if (m.runtimeConfig.hasSoloGroups)
                if (not itGroup.isSolo)
                    goto skipItGroup
                end if
            end if
            
            testCases = testSuite.testCases
            testCount = testCases.Count()
            if (testCount = 0)
                if (m.config.logLevel = 2)
                    ? "Ignoring TestSuite " ; itGroup.name ; " - NO TEST CASES"
                end if
                goto skipItGroup
            end if
            
            alltestCount = alltestCount + testCount
    
            if RBS_CMN_IsFunction(testSuite.SetUp)
                testSuite.SetUp()
            end if
    
            suiteStatObj = m.logger.CreateSuiteStatistic(itGroup.Name)
    
            for each testCase in testCases
                metaTestCase = itGroup.testCaseLookup[testCase.Name]
                if (m.runtimeConfig.hasSoloTests and not metaTestCase.isSolo)
                    goto skipTestCase
                end if
                
                if RBS_CMN_IsFunction(testSuite.beforeEach)
                    testSuite.beforeEach()
                end if

                testTimer = CreateObject("roTimespan")
                testStatObj = m.logger.CreateTestStatistic(testCase.Name)
                testSuite.testCase = testCase.Func
                testStatObj.filePath = metaTestSuite.filePath
                testStatObj.metaTestCase = metaTestCase
                testSuite.currentResult = UnitTestResult()
                
                testStatObj.metaTestCase.testResult = testSuite.currentResult
                 
                'TODO move execution logic to another method
                'not doing now coz I'm not sure about scoping implications 
                if (metaTestCase.rawParams <> invalid)
                    testCaseParams = invalid
                    isSucess = eval("testCaseParams = " + metaTestCase.rawParams)
                    argsValid = RBS_CMN_IsArray(testCaseParams)
                        
                    if (argsValid)
                        'up to 6 param args supported for now 
                        if (testCaseParams.count() = 1)
                            testSuite.testCase(testCaseParams[0])
                        else if (testCaseParams.count() = 2)
                            testSuite.testCase(testCaseParams[0], testCaseParams[1])
                        else if (testCaseParams.count() = 3)
                            testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2])
                        else if (testCaseParams.count() = 4)
                            testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3])
                        else if (testCaseParams.count() = 5)
                            testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4])
                        else if (testCaseParams.count() = 6)
                            testSuite.testCase(testCaseParams[0], testCaseParams[1], testCaseParams[2], testCaseParams[3], testCaseParams[4], testCaseParams[5])
                        end if                                                            
                    else
                        ? "Could not parse args for test " ; testCase.name
                        testSuite.Fail("Could not parse args for test ")
                    end if
                else
                    testSuite.testCase()                    
                end if
                testSuite.AssertMocks()
                testSuite.CleanMocks()
                testSuite.CleanStubs()
                runResult = testSuite.currentResult.GetResult()


                if runResult <> ""
                    testStatObj.Result          = "Fail"
                    testStatObj.Error.Code      = 1
                    testStatObj.Error.Message   = runResult
                else
                    testStatObj.Result          = "Success"
                end if

                testStatObj.Time = testTimer.TotalMilliseconds()
                m.logger.AppendTestStatistic(suiteStatObj, testStatObj)

                if RBS_CMN_IsFunction(testCase.afterEach)
                    testSuite.afterEach()
                end if
                
                if testStatObj.Result <> "Success"
                    totalStatObj.testRunHasFailures = true
                end if 
                
                if testStatObj.Result = "Fail" and m.config.failFast = true
                    exit for
                end if
                skipTestCase:
            end for
            
            suiteStatObj.metaTestSuite = metaTestSuite
            m.logger.AppendSuiteStatistic(totalStatObj, suiteStatObj)
    
            if RBS_CMN_IsFunction(testSuite.TearDown)
                testSuite.TearDown()
            end if
    
            if (testStatObj = invalid or testStatObj.Result = "Fail") and m.config.failFast = true
                exit for
            end if
            skipItGroup:
        end for
        skipSuite:
    end for

    m.logger.PrintStatistic(totalStatObj)
    END
    'RBS_TR_SendHomeKeypress()
end sub

sub RBS_TR_SendHomeKeypress()
    ut = CreateObject("roUrlTransfer")
    ut.SetUrl("http://localhost:8060/keypress/Home")
    ut.PostFromString("")
end sub

'*************************************************************
'** RunNodeTests
'** executes the tests in a test suite, on the given node
'*************************************************************
function Rooibos_RunNodeTests(args) as void
    ? " RUNNING NODE TESTS!!!!"
    stop
end function
