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


function RBS_ItG_GetTestCases(group) as object
    if (group.hasSoloTests)
        return group.soloTestCases
    else
        return group.testCases
    end if
end function

function RBS_ItG_GetRunnableTestSuite(group) as object
    testCases = RBS_ItG_GetTestCases(group)
   
    runnableSuite = BaseTestSuite()
    runnableSuite.name = group.name
    
    for each testCase in testCases
        name = testCase.name
        if (testCase.isSolo)
            name += " [SOLO] "
        end if
        runnableSuite.addTest(name, testCase.func, testCase.funcName)
        group.testCaseLookup[name] = testCase
    end for
    
    runnableSuite.SetUp = RBS_CMN_GetFunction(group.setupFunction, group.setupFunctionName)
    runnableSuite.TearDown =  RBS_CMN_GetFunction(group.teardownFunction, group.teardownFunctionName)
    runnableSuite.BeforeEach =  RBS_CMN_GetFunction(group.beforeEachFunction, group.beforeEachFunctionName) 
    runnableSuite.AftrEach =  RBS_CMN_GetFunction(group.afterEachFunction, group.afterEachFunctionName) 
    
    return runnableSuite
end function
