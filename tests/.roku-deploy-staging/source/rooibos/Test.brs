function __Rooibos_Test_builder()
    instance = {}
    instance.new = function(testGroup, data)
        m.name = invalid
        m.isSolo = invalid
        m.funcName = invalid
        m.isIgnored = invalid
        m.lineNumber = invalid
        m.paramLineNumber = invalid
        m.testSuite = invalid
        m.testGroup = invalid
        m.rawParams = invalid
        m.paramTestIndex = invalid
        m.isParamTest = false
        m.isParamsValid = false
        m.result = invalid
        m.testGroup = testGroup
        m.testSuite = testGroup.testSuite
        m.isSolo = data.isSolo
        m.funcName = data.funcName
        m.isIgnored = data.isIgnored
        m.name = data.name
        m.lineNumber = data.lineNumber
        m.paramLineNumber = data.paramLineNumber
        m.rawParams = data.rawParams
        m.paramTestIndex = data.paramTestIndex
        m.isParamTest = data.isParamTest
        m.expectedNumberOfParams = data.expectedNumberOfParams
        if m.isParamTest then
            m.name = m.name + stri(m.paramTestIndex)
        end if
        m.result = Rooibos_TestResult(m)
        return this
    end function
    instance.run = function()
        timer = createObject("roTimespan")
        timer.mark()
        if m.isParamTest then
            m.runParamsTest()
        else
            m.testSuite[m.funcName]()
        end if
        m.result.time = timer.totalMilliseconds()
    end function
    instance.runParamsTest = function()
        testParams = m.getTestParams()
        if m.expectedNumberOfParams = 1 then
            m.testSuite[m.funcName](testParams[0])
        else if m.expectedNumberOfParams = 2 then
            m.testSuite[m.funcName](testParams[0], testParams[1])
        else if m.expectedNumberOfParams = 3 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2])
        else if m.expectedNumberOfParams = 4 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3])
        else if m.expectedNumberOfParams = 5 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4])
        else if m.expectedNumberOfParams = 6 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5])
        else if m.expectedNumberOfParams = 7 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6])
        else if m.expectedNumberOfParams = 8 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6], testParams[7])
        else if m.expectedNumberOfParams = 9 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6], testParams[7], testParams[8])
        else if m.expectedNumberOfParams = 10 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6], testParams[7], testParams[8], testParams[9])
        else if m.expectedNumberOfParams = 11 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6], testParams[7], testParams[8], testParams[9], testParams[10])
        else if m.expectedNumberOfParams = 12 then
            m.testSuite[m.funcName](testParams[0], testParams[1], testParams[2], testParams[3], testParams[4], testParams[5], testParams[6], testParams[7], testParams[8], testParams[9], testParams[10], testParams[11])
        else if m.expectedNumberOfParams > 12 then
            m.testSuite.fail("Test case had more than 12 params. Max of 12 params is supported")
        end if
    end function
    instance.getTestParams = function()
        params = []
        for paramIndex = 0 to m.rawParams.count()
            paramValue = m.rawParams[paramIndex]
            if type(paramValue) = "roString" and len(paramValue) >= 8 and left(paramValue, 8) = "#RBSNode" then
                nodeType = "ContentNode"
                paramDirectiveArgs = paramValue.split("|")
                if paramDirectiveArgs.count() > 1 then
                    nodeType = paramDirectiveArgs[1]
                end if
                paramValue = createObject("roSGNode", nodeType)
            end if
            params.push(paramValue)
        end for
        return params
    end function
    return instance
end function
function Rooibos_Test(testGroup, data)
    instance = __Rooibos_Test_builder()
    instance.new(testGroup, data)
    return instance
end function