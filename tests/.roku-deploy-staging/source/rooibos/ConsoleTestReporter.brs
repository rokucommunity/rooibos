function __Rooibos_ConsoleTestReporter_builder()
    instance = __Rooibos_BaseTestReporter_builder()
    instance.super0_new = instance.new
    instance.new = function(testRunner)
        m.super0_new(testRunner)
        m.lineWidth = 60
    end function
    instance.super0_reportResults = instance.reportResults
    instance.reportResults = function(allStats)
        m.allStats = allStats
        m.startReport()
        for each testSuite in m.testRunner.testSuites
            if not m.allStats.hasFailures or ((not m.config.showOnlyFailures) or testSuite.failedCount > 0 or testSuite.crashedCount > 0) then
                m.printSuiteStart(testSuite)
                for each testGroup in testSuite.groups
                    m.printGroup(testGroup)
                end for
            end if
        end for
        m.printLine()
        m.endReport()
        'bs:disable-next-line
        ignoredInfo = m.testRunner.runtimeConfig.getIgnoredTestInfo()
        m.printLine(0, "Total  = " + Rooibos_Common_AsString(m.allStats.total) + "  + Passed  = " + Rooibos_Common_AsString(m.allStats.passedCount) + "  + Failed   = " + Rooibos_Common_AsString(m.allStats.failedCount) + "  + Ignored   = " + Rooibos_Common_AsString(ignoredInfo.count))
        m.printLine(0, " Time spent: " + Rooibos_Common_AsString(m.allStats.time) + "ms")
        m.printLine()
        m.printLine()
        if ignoredInfo.count > 0 then
            m.printLine(0, "IGNORED TESTS:")
            for each ignoredItemName in ignoredInfo.items
                m.printLine(1, ignoredItemName)
            end for
            m.printLine()
            m.printLine()
        end if
        if m.allStats.hasFailures then
            overrallResult = "Success"
        else
            overrallResult = "Fail"
        end if
        m.printLine(0, "RESULT: " + overrallResult)
    end function
    instance.printGroup = function(testGroup)
        m.printGroupStart(testGroup)
        for each test in testGroup.tests
            if not m.allStats.hasFailures or ((not m.config.showOnlyFailures) or test.result.isFail) then
                m.printTest(test)
            end if
        end for
        m.printLine(0, " |")
    end function
    instance.printTest = function(test)
        if test.result.isFail then
            testChar = "-"
            locationLine = StrI(test.result.lineNumber).trim()
        else
            testChar = "|"
            locationLine = StrI(test.lineNumber).trim()
        end if
        locationText = "pkg:/" + test.testSuite.filePath.trim() + "(" + locationLine + ")"
        if m.config.printTestTimes = true then
            timeText = " (" + stri(test.result.time).trim() + "ms)"
        else
            timeText = ""
        end if
        insetText = ""
        if test.isParamTest <> true then
            messageLine = Rooibos_Common_fillText(" " + testChar + " |--" + test.name + " : ", ".", 80)
            m.printLine(0, messageLine + test.result.getStatusText() + timeText)
        else if test.paramTestIndex = 0 then
            name = test.name
            if len(name) > 1 and right(name, 1) = "0" then
                name = left(name, len(name) - 1)
            end if
            m.printLine(0, " " + testChar + " |--" + name + " : ")
        end if
        if test.isParamTest = true then
            insetText = "  "
            if type(test.rawParams) = "roAssociativeArray" then
                rawParams = {}
                for each key in test.rawParams
                    if type(test.rawParams[key]) <> "Function" and type(test.rawParams[key]) <> "roFunction" then
                        rawParams[key] = test.rawParams[key]
                    end if
                end for
            else
                rawParams = test.rawParams
            end if
            messageLine = Rooibos_Common_fillText(" " + testChar + insetText + " |--" + formatJson(rawParams) + " : ", ".", 80)
            m.printLine(0, messageLine + test.result.getStatusText() + timeText)
        end if
        if test.result.isFail then
            m.printLine(0, " | " + insettext + "  |--Location: " + locationText)
            if test.isParamTest = true then
                m.printLine(0, " | " + insettext + "  |--Param Line: " + StrI(test.paramlineNumber).trim())
            end if
            m.printLine(0, " | " + insettext + "  |--Error Message: " + test.result.message)
        end if
    end function
    instance.startReport = function()
        m.printLine()
        m.printLine(0, "[START TEST REPORT]")
        m.printLine()
    end function
    instance.endReport = function()
        m.printLine()
        m.printLine(0, "[END TEST REPORT]")
        m.printLine()
    end function
    instance.printSuiteStart = function(testSuite)
        m.printLine(0, " " + testSuite.name + " pkg:/" + testSuite.filePath.trim() + "(" + str(testSuite.lineNumber).trim() + ")")
    end function
    instance.printGroupStart = function(testGroup)
        m.printLine(0, " |-" + testGroup.name)
    end function
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '++ printing
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    instance.super0_testLogInfo = instance.testLogInfo
    instance.testLogInfo = function(text)
        print "INFO " ; text
    end function
    instance.super0_testLogError = instance.testLogError
    instance.testLogError = function(text)
        print "ERROR " ; text
    end function
    instance.printLine = function(depth = 0, text = "")
        print " " ; text
    end function
    return instance
end function
function Rooibos_ConsoleTestReporter(testRunner)
    instance = __Rooibos_ConsoleTestReporter_builder()
    instance.new(testRunner)
    return instance
end function