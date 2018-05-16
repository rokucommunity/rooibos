' /**
'  * @module ItGroup
'  */
function UnitTestItGroup(name as string, isSolo as boolean, isIgnored as boolean)
    this = {}
    this.testCases = createObject("roArray", 0, true)
    this.ignoredTestCases = CreateObject("roArray",0, true)
    this.soloTestCases = CreateObject("roArray",0, true)
    
    this.testCaseLookup = {}
    
    this.setupFunction = invalid
    this.setupFunctionName = ""
    this.tearDownFunction = invalid
    this.tearDownFunctionName = ""
    
    this.tearDownFunctionName = ""
    this.beforeEachFunction = invalid
    this.beforeEachFunctionName = ""
    this.afterEachFunction = invalid
    this.afterEachFunctionName = ""
    
    this.isSolo = isSolo
    this.isIgnored = isIgnored
    this.hasSoloTests = false
    this.name = name
    this.AddTestCase = RBS_ItG_AddTestCase
    this.GetTestCases = RBS_ItG_GetTestCases
    this.GetRunnableTestSuite = RBS_ItG_GetRunnableTestSuite
    return this
end function

function RBS_ItG_AddTestCase(testCase)
    if (testCase.isSolo)
        m.hasSoloTestCases = true
        m.soloTestCases.push(testCase)
        m.hasSoloTests = true
    else if (testCase.isIgnored)
        m.ignoredTestCases.push(testCase)
    else
        m.testCases.push(testCase)
    end if
end function


function RBS_ItG_GetTestCases() as object
    if (m.hasSoloTests)
        return m.soloTestCases
    else
        return m.testCases
    end if
end function

function RBS_ItG_GetRunnableTestSuite()
    testCases = m.GetTestCases()
   
    runnableSuite = BaseTestSuite()
    runnableSuite.name = m.name
    
    for each testCase in testCases
        name = testCase.name
        if (testCase.isSolo)
            name += " [SOLO] "
        end if
        runnableSuite.addTest(name, testCase.func)
        m.testCaseLookup[name] = testCase
    end for
    runnableSuite.SetUp = m.setupFunction
    runnableSuite.TearDown =  m.teardownFunction
    runnableSuite.BeforeEach =  m.beforeEachFunction
    runnableSuite.AftrEach =  m.afterEachFunction
    
    
    return runnableSuite
end function
