function UnitTestSuite(filePath as string, maxLinesWithoutSuiteDirective = 100, supportLegacyTests  = false)
    this = {}
    this.filePath = filePath
    this.name = ""
    this.valid = false
    this.hasFailures = false
    this.hasSoloTests = false
    this.hasSoloGroups = false
    this.isSolo = false
    this.isIgnored = false
    this.itGroups = CreateObject("roArray",0, true)
    this.setupFunction = invalid
    this.setupFunctionName = ""
    this.tearDownFunction = invalid
    this.tearDownFunctionName = ""
    this.isNodeTest = false
    this.nodeTestFileName = ""
    this.ProcessSuite = RBS_TS_ProcessSuite
    this.ResetCurrentTestCase = RBS_TS_ResetCurrentTestCase
    this.ProcessLegacySuite = RBS_TS_ProcessLegacySuite  
    this.ProcessSuite(maxLinesWithoutSuiteDirective, supportLegacyTests )
    this.currentGroup = invalid
    return this
end function

function RBS_TS_ProcessSuite(maxLinesWithoutSuiteDirective, supportLegacyTests )
    'find a marker to indicate this is a test suite
    code = RBS_CMN_AsString(ReadAsciiFile(m.filePath))

    isTestSuite = false

    TAG_TEST_SUITE = "'@TestSuite"
    TAG_IT = "'@It"
    TAG_IGNORE = "'@Ignore"
    TAG_SOLO = "'@Only"
    TAG_TEST = "'@Test"
    TAG_NODE_TEST = "'@SGNode"
    TAG_SETUP = "'@Setup"
    TAG_TEAR_DOWN = "'@TearDown"
    TAG_BEFORE_EACH = "'@BeforeEach"
    TAG_AFTER_EACH = "'@AfterEach"
    TAG_TEST_PARAMS = "'@Params"
    TAG_TEST_IGNORE_PARAMS = "'@IgnoreParams"
    functionNameRegex = CreateObject("roRegex", "^(function|sub)\s([0-9a-z\_]*)\s*\(", "i")
    assertInvocationRegex = CreateObject("roRegex", "^\s*(m.fail|m.Fail|m.assert|m.Assert)(.*)\(", "i")
    functionEndRegex = CreateObject("roRegex", "^\s*(end sub|end function)", "i")
    
    if code <> ""
        isTokenItGroup = false
        isNextTokenIgnore = false
        isNextTokenSolo = false
        isNextTokenTest = false
        isTestSuite = false
        isNextTokenSetup = false
        isNextTokenTeardown = false
        isNextTokenBeforeEach = false
        isNextTokenAfterEach = false
        isNextTokenNodeTest = false
        isNextTokenTestCaseParam = false
        nodeTestFileName = ""
        nextName = ""
        m.name = m.filePath
        lineNumber = 0
        m.ResetCurrentTestCase()
        currentLocation =""
        for each line in code.Split(chr(10))
            lineNumber++
            currentLocation = m.filePath + ":" + stri(lineNumber)
            if (lineNumber > maxLinesWithoutSuiteDirective and not isTestSuite)
                'TODO add logging option for this             
'                ? "IGNORING FILE WITH NO TESTSUITE DIRECTIVE : "; currentLocation
                goto exitProcessing
            end if

            if (RBS_TS_IsTag(line, TAG_TEST_SUITE))
                if (isTestSuite)
                    ? "Multiple suites per file are not supported - use '@It tag"
                end if
                
                name = RBS_TS_GetTagText(line, TAG_TEST_SUITE)
                
                if (name <> "")
                    m.name = name
                end if
                
                if (isNextTokenSolo)
                    m.isSolo = true
                    m.name += " [ONLY]"
                end if
                isTestSuite = true
                
                if (isNextTokenNodeTest)
                    m.nodeTestFileName = nodeTestFileName
                    m.isNodeTest = true
                end if
                
                if (isNextTokenIgnore)
                    m.isIgnored = true
                    goto exitProcessing
                end if

                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_IT))
                if (not isTestSuite)
                    ? "File not identified as testsuite!"
                end if
                
                name = RBS_TS_GetTagText(line, TAG_IT)
                
                if (name = "")
                    name = "UNNAMED TAG_TEST GROUP - name this group for better readability - e.g. 'Tests the Load method... '"
                end if

                m.currentGroup = UnitTestItGroup(name, isNextTokenSolo, isNextTokenIgnore)
                
                'inherit all suite functions that were set up to now
                m.currentGroup.setupFunctionName = m.setupFunctionName
                m.currentGroup.setupFunction = m.setupFunction
                m.currentGroup.tearDownFunctionName = m.tearDownFunctionName
                m.currentGroup.tearDownFunction = m.tearDownFunction
                m.currentGroup.beforeEachFunctionName = m.beforeEachFunctionName
                m.currentGroup.beforeEachFunction = m.beforeEachFunction
                m.currentGroup.afterEachFunctionName = m.afterEachFunctionName
                m.currentGroup.afterEachFunction = m.afterEachFunction
                
                m.itGroups.push(m.currentGroup)
                if (isNextTokenSolo)
                    m.hasSoloGroups = true
                end if
                isTokenItGroup = true           
            else if (line = TAG_SOLO)
                if (isNextTokenSolo)
                    ? "TAG_TEST MARKED FOR TAG_IGNORE AND TAG_SOLO"
                else 
                    isNextTokenSolo = true
                end if
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_IGNORE) and not RBS_TS_IsTag(line, TAG_TEST_IGNORE_PARAMS))
                isNextTokenIgnore = true
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_NODE_TEST))
                if (isTestSuite)
                     ? "FOUND " ; TAG_NODE_TEST ; " AFTER '@TestSuite annotation - This test will subsequently not run as a node test. "
                     ? "If you wish to run this suite of tests on a node, then make sure the " ; TAG_NODE_TEST ; " annotation appeares before the " ; TAG_TEST_SUITE ; " Annotation"
                end if
                nodeTestFileName = RBS_TS_GetTagText(line, TAG_NODE_TEST)
                isNextTokenNodeTest = true
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_TEST))
                if (not isTestSuite)
                    ? "FOUND " ; TAG_TEST; " BEFORE '@TestSuite declaration - skipping test file! "; currentLocation
                    goto exitProcessing
                end if
                if (m.currentGroup = invalid)
                    ? "FOUND " ; TAG_TEST; " BEFORE '@It declaration - skipping test file!"; currentLocation
                    goto exitProcessing
                end if
                m.ResetCurrentTestCase()
                isNextTokenTest = true
                nextName = RBS_TS_GetTagText(line, TAG_TEST)
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_SETUP))
             if (not isTestSuite)
                    ? "FOUND " ; TAG_SETUP ; " BEFORE '@TestSuite declaration - skipping test file!"; currentLocation
                    goto exitProcessing
                end if
                isNextTokenSetup = true
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_TEAR_DOWN))
                if (not isTestSuite)
                    ? "FOUND " ; TAG_TEAR_DOWN ; " BEFORE '@TestSuite declaration - skipping test file!"; currentLocation
                    goto exitProcessing
                end if
                isNextTokenTeardown = true
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_BEFORE_EACH))
                if (not isTestSuite)
                    ? "FOUND " ; TAG_BEFORE_EACH ; " BEFORE '@TestSuite declaration - skipping test file!"; currentLocation
                    goto exitProcessing
                end if
                isNextTokenBeforeEach = true
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_AFTER_EACH))
                if (not isTestSuite)
                    ? "FOUND " ; TAG_AFTER_EACH ; " BEFORE '@TestSuite declaration - skipping test file!"; currentLocation
                    goto exitProcessing
                end if
                isNextTokenAfterEach = true
                goto exitLoop
            else if (assertInvocationRegex.IsMatch(line))
                if (not m.hasCurrentTestCase)
                    ? "Found assert before test case was declared! " ; currentLocation 
                else                
                    for testCaseIndex = 0 to m.currentTestCases.count() -1
                        tc = m.currentTestCases[testCaseIndex]
                        tc.AddAssertLine(lineNumber)
                    end for
                end if
                goto exitLoop
            else if (isNextTokenTest and functionEndRegex.IsMatch(line))
                m.ResetCurrentTestCase()
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_TEST_IGNORE_PARAMS))
                isNextTokenTestCaseParam = true ' this keeps the processing going down to the function
                goto exitLoop
            else if (RBS_TS_IsTag(line, TAG_TEST_PARAMS))
                if (not isNextTokenTest) 
                    ? "FOUND " ; TAG_TEST; " PARAM WTAG_ITHOUT @Test declaration "; currentLocation
                else

                    isNextTokenTestCaseParam = true
                    rawParams = RBS_TS_GetTagText(line, TAG_TEST_PARAMS)
                    m.testCaseParams.push(rawParams)
                end if
                goto exitLoop
            end if
            
            if (isTokenItGroup or isNextTokenTest or isNextTokenSetup or isNextTokenBeforeEach or isNextTokenAfterEach or isNextTokenTeardown)
                'have to find a function definition here - if it's not then this i
                        
                if functionNameRegex.IsMatch(line)
                    functionName = functionNameRegex.Match(line).Peek()
    
                    functionPointer = RBS_CMN_GetFunction(invalid, functionName)
                    if (functionPointer <> invalid)
                        if (isNextTokenTest)
                            if (nextName <> "") 
                                testName = nextName
                            else
                                testName = functionName
                            end if
                            if nodeTestFileName = "" nodeTestFileName = m.nodeTestFileName

                            if (m.testCaseParams.count() >0)
                                for index = 0 to m.testCaseParams.count() -1
                                    params = m.testCaseParams[index]

                                    testCase = UnitTestCase(testName, functionPointer, functionName, isNextTokenSolo, isNextTokenIgnore, lineNumber, params, index)
                                    testCase.isParamTest = true
                                    if (testCase <> invalid)
                                        m.currentTestCases.push(testCase)
                                    else
                                        ? "Skipping unparseable params for testcase " ; params ; " @" ; currentLocation
                                    end if
                                end for
                            else
                                testCase = UnitTestCase(testName, functionPointer, functionName, isNextTokenSolo, isNextTokenIgnore, lineNumber)
                                m.currentTestCases.push(testCase)
                            end if                            

                            for each testCase in m.currentTestCases 
                                m.currentGroup.AddTestCase(testCase)
                            end for
                            
                            m.hasCurrentTestCase = true
                            
                            if (isNextTokenSolo)
                                m.currentGroup.hasSoloTests = true
                                m.hasSoloTests = true
                            end if
                            
                        else if (isNextTokenSetup)
                            if (m.currentGroup = invalid)
                                m.setupFunctionName = functionName
                                m.setupFunction = functionPointer
                            else
                                m.currentGroup.setupFunctionName = functionName
                                m.currentGroup.setupFunction = functionPointer
                            end if 
                        else if (isNextTokenTearDown)
                            if (m.currentGroup = invalid)
                                m.tearDownFunctionName = functionName
                                m.tearDownFunction = functionPointer
                            else 
                                m.currentGroup.tearDownFunctionName = functionName
                                m.currentGroup.tearDownFunction = functionPointer
                            end if
                        else if (isNextTokenBeforeEach)
                            if (m.currentGroup = invalid)
                                m.beforeEachFunctionName = functionName
                                m.beforeEachFunction = functionPointer
                            else 
                                m.currentGroup.beforeEachFunctionName = functionName
                                m.currentGroup.beforeEachFunction = functionPointer
                            end if
                        else if (isNextTokenAfterEach)
                            if (m.currentGroup = invalid)
                                m.afterEachFunctionName = functionName
                                m.afterEachFunction = functionPointer
                            else 
                                m.currentGroup.afterEachFunctionName = functionName
                                m.currentGroup.afterEachFunction = functionPointer
                            end if
                        end if
                    else
                        ? " could not get function pointer for "; functionName ; " ignoring"
                    end if
                else if (not isTokenItGroup and not isNextTokenTestCaseParam)
                    ? "Ignoring test - function name did not immediately follow '@Test or '@Params directive - line was instead : " ; line ; " @ "; m.filePath ; "("; StrI(lineNumber).trim() ; ")"
                end if
                
                isNextTokenIgnore = false
                isNextTokenSolo = false
                
                if (isNextTokenTestCaseParam)
                    isNextTokenTest = false
                else                            
                    isNextTokenTest = false
                end if
                  
                isNextTokenSetup = false
                isNextTokenTearDown = false
                isNextTokenAfterEach = false
                isNextTokenBeforeEach = false
                isNextTokenNodeTest = false
                isTokenItGroup = false
                isNextTokenTestCaseParam = false
                nodeTestFileName = ""
                nextName = ""
                 
            end if
            exitLoop:
        end for
        exitProcessing:
    else
        ? " Error opening potential test file " ; filePath ; " ignoring..."
    end if
    m.delete("testCaseParams")
    m.delete("currentTestCases")
    m.delete("hasCurrentTestCase")
    
    if (isTestSuite)
      m.isValid = true
    else if (supportLegacyTests = true)
'    TODO add logging option for this
'      ? "File appears to not be a test suite - checking if it's a legacy suite"
      m.ProcessLegacySuite(maxLinesWithoutSuiteDirective)
    else
'    TODO add logging option for this
      ? "Ignoring non test/legacy test file "; filePath
      m.isValid = false
    end if
end function

function RBS_TS_IsTag(text, tag) as boolean
    return Left(text,len(tag)) = tag
end function

function RBS_TS_GetTagText(text, tag) as string
    return Mid(text, len(tag) +1).trim()
end function


function RBS_TS_ResetCurrentTestCase() as void
    m.testCaseParams = CreateObject("roArray",0, true)
    m.currentTestCases = CreateObject("roArray",0, true) ' we can have multiple test cases based on our params
    m.hasCurrentTestCase = false
end function


'Legacy test suite support
function RBS_TS_ProcessLegacySuite(maxLinesWithoutSuiteDirective)
    'find a marker to indicate this is a test suite
    code = RBS_CMN_AsString(ReadAsciiFile(m.filePath))

    isTestSuite = false
    dblQ = chr(34)
    
    testSuiteFunctionNameRegex = CreateObject("roRegex", "^\s*(function|sub)\s*testSuite_([0-9a-z\_]*)\s*\(", "i")
    testCaseFunctionNameRegex = CreateObject("roRegex", "^\s*(function|sub)\s*testCase_([0-9a-z\_]*)\s*\(", "i")
    functionNameRegex = CreateObject("roRegex", "^\s*(function|sub)\s([0-9a-z\_]*)\s*\(", "i")
    assertInvocationRegex = CreateObject("roRegex", "^\s*(m.fail|m.Fail|m.assert|m.Assert)(.*)\(", "i")
    functionEndRegex = CreateObject("roRegex", "^\s*(end sub|end function)", "i")
    
    testSuiteNameRegex = CreateObject("roRegex", "^\s*this\.name\s*=\s*\" + dblQ + "([0-9a-z\_]*)\s*\" + dblQ, "i")
    setupregex = CreateObject("roRegex", "^\s*this\.setup\s*=\s*([a-z_0-9]*)","i")
    addTestregex = CreateObject("roRegex", "^\s*this\.addTest\s*\(\" + dblQ + "([0-9a-z\_]*)\" + dblQ + "\s*,\s*([0-9a-z\_]*)\s*\)", "i")

    'support ignoring/onlying entire test suites    
    TAG_IGNORE = "'@Ignore"
    TAG_SOLO = "'@Only"

    isIgnored = false
    isSolo = false
    if code <> ""
        m.testCaseMap = {} ' map of legacy test cases to function names
        
        isInInitFunction = false
        isTestSuite = false
        nodeTestFileName = ""
        m.name = m.filePath
        lineNumber = 0
        m.ResetCurrentTestCase()
        currentTestCase = invalid
        currentLocation =""
        for each line in code.Split(chr(10))
          lineNumber++
          currentLocation = m.filePath + ":" + stri(lineNumber)
          if (lineNumber > maxLinesWithoutSuiteDirective and not isTestSuite)
              ? "IGNORING FILE WITH NO testSuiteInit function : "; currentLocation
              goto exitProcessing
          end if
          
          if (RBS_TS_IsTag(line, TAG_SOLO))
            isSolo = true
            ? " IS SOLO TEST!"
            goto exitLoop
          end if
          
          if (RBS_TS_IsTag(line, TAG_IGNORE))
            isIgnored = true
            ? " IS IGNORED TEST!"
            goto exitLoop
          end if
          
          'check if test suite init function
          if testSuiteFunctionNameRegex.IsMatch(line)
'            ? "Detected legacy test suite function name with line: " ; line
            isTestSuite = true
            isInInitFunction = true
            goto exitLoop
          end if
              
          if setupregex.IsMatch(line)
            if not isInInitFunction
              ? "Found test suite setup invocation outside of test suite init function"
              goto exitLoop
            end if
            functionName = setupregex.Match(line).peek()
            functionPointer = RBS_CMN_GetFunction(invalid, functionName)
            if (functionPointer <> invalid)
              m.setupFunctionName = functionName
              m.setupFunction = functionPointer
            else
              ? " the function name for the setup method "; functionName ; " could not be found"
            end if
            goto exitLoop
          end if         
                 
          'check if init function ended
          if functionEndRegex.IsMatch(line)
            if (isInInitFunction)
'              print "detected end of init function - creatign test group named " ; m.name
              m.currentGroup = UnitTestItGroup(m.name, false, false)
              
              'inherit all suite functions that were set up to now
              m.currentGroup.setupFunctionName = m.setupFunctionName
              m.currentGroup.setupFunction = m.setupFunction
              m.currentGroup.isLegacy = true
              m.itGroups.push(m.currentGroup)
              isInInitFunction = false
              m.isSolo = isSolo
              m.isIgnored = isIgnored
              isIgnored = false
              isSolo = false
            end if
            
            currentTestCase = invalid
            goto exitLoop
          end if
              
          'init function test suite name
          if testSuiteNameRegex.IsMatch(line)
            if (not isInInitFunction)
              ? "Found set testsuite name, when not in a legacy test suite init function. ignoring"
              goto exitLoop
            end if
            
            name = testSuiteNameRegex.Match(line).Peek()
            
            if (name <> "")
              m.name = name
            end if
            
            goto exitLoop
          end if

          'init function add test cases
          if addTestregex.IsMatch(line)
              if (not isInInitFunction)
                  ? "Found addTestCase, when not in a legacy test suite init function. Ignoring"
                  goto exitLoop
              end if
              
              match = addTestregex.Match(line)
              testCaseName = match[1]
              testCaseFunctionName = match[2]

              if (testCaseName <> "" and testCaseFunctionName <> "")
                  m.testCaseMap[lcase(testCaseFunctionName)] = testCaseName 
              else
                ? " found badly formed add test case function call in test suite init fuction. Ignoring" 
              end if
              
              goto exitLoop
          end if

          'assert line            
          if (assertInvocationRegex.IsMatch(line))
            if (not m.hasCurrentTestCase)
              ? "Found assert before test case was declared! " ; currentLocation 
            else                
                currentTestCase.AddAssertLine(lineNumber)
            end if
            goto exitLoop
          end if

          'test case function impl
          if testCaseFunctionNameRegex.IsMatch(line)
            if (m.currentGroup = invalid)
              ? " found test case before a group was setup - could be that the init function never terminated"
              goto exitLoop
            end if
            functionName = testCaseFunctionNameRegex.Match(line).peek()
            m.ResetCurrentTestCase()
            if (functionName <> "")
              'We have a match add the test
              functionName = "testcase_" + lcase(functionName)
              testName = m.testCaseMap[functionName]
              if (testName = invalid or testName = "")
                print "Encountered test function " ; functionName; " but found no matching AddTestCase invocation"
                goto exitLoop
              end if
              
              functionPointer = RBS_CMN_GetFunction(invalid, functionName)
              if (functionPointer <> invalid)
                if nodeTestFileName = "" nodeTestFileName = m.nodeTestFileName
                currentTestCase = UnitTestCase(testName, functionPointer, functionName, isSolo, isIgnored, lineNumber)
                m.currentGroup.AddTestCase(currentTestCase)
                m.hasCurrentTestCase = true
                if (isSolo)
                  m.isSolo = true
                end if
              else
                  ? " could not get function pointer for "; functionName ; " ignoring"
              end if
            else
              ? " found badly named test case function. ignoring" 
            end if
            isSolo = false
            isIgnored = false
          end if
          exitLoop:
        end for
        exitProcessing:
    else
        ? " Error opening potential test file " ; filePath ; " ignoring..."
    end if
    m.isValid = isTestSuite
end function

