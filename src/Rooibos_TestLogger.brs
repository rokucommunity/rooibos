' /**
'  * @module Logger
'  */
function Logger(config) as Object
    this = {}
    this.config = config

    this.verbosityLevel = {
        basic   : 0
        normal  : 1
        verbose : 2   
    }

    ' Internal properties
    this.verbosity              = this.config.logLevel
    this.serverURL              = invalid

    ' Interface
    this.PrintStatistic         = RBS_LOGGER_PrintStatistic

    this.CreateTotalStatistic   = RBS_LOGGER_CreateTotalStatistic
    this.CreateSuiteStatistic   = RBS_LOGGER_CreateSuiteStatistic
    this.CreateTestStatistic    = RBS_LOGGER_CreateTestStatistic
    this.AppendSuiteStatistic   = RBS_LOGGER_AppendSuiteStatistic
    this.AppendTestStatistic    = RBS_LOGGER_AppendTestStatistic

    ' Internal functions
    this.PrintMetaSuiteStart    = RBS_LOGGER_PrintMetaSuiteStart
    this.PrintSuiteStatistic    = RBS_LOGGER_PrintSuiteStatistic
    this.PrintTestStatistic     = RBS_LOGGER_PrintTestStatistic
    this.PrintStart             = RBS_LOGGER_PrintStart
    this.PrintEnd               = RBS_LOGGER_PrintEnd
    this.PrintSuiteSetUp        = RBS_LOGGER_PrintSuiteSetUp
    this.PrintSuiteStart        = RBS_LOGGER_PrintSuiteStart
    this.PrintSuiteEnd          = RBS_LOGGER_PrintSuiteEnd
    this.PrintSuiteTearDown     = RBS_LOGGER_PrintSuiteTearDown
    this.PrintTestSetUp         = RBS_LOGGER_PrintTestSetUp
    this.PrintTestStart         = RBS_LOGGER_PrintTestStart
    this.PrintTestEnd           = RBS_LOGGER_PrintTestEnd
    this.PrintTestTearDown      = RBS_LOGGER_PrintTestTearDown

    return this
end function

'----------------------------------------------------------------
' Print statistic object with specified verbosity.
' 
' @param statObj (object) A statistic object to print.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintStatistic(statObj as Object)
    m.PrintStart()
    previousfile = invalid
    
    for each testSuite in statObj.Suites
        if (not statObj.testRunHasFailures or ((not m.config.showOnlyFailures) OR testSuite.fail > 0 or testSuite.crash > 0))  
            if (testSuite.metaTestSuite.filePath <> previousfile)
                m.PrintMetaSuiteStart(testSuite.metaTestSuite)
                previousfile = testSuite.metaTestSuite.filePath
            end if
            m.PrintSuiteStatistic(testSuite, statObj.testRunHasFailures)
        end if
    end for

    ? ""
    m.PrintEnd()

    ? "Total  = "; RBS_CMN_AsString(statObj.Total); " ; Passed  = "; statObj.Correct; " ; Failed   = "; statObj.Fail; " ; Crashes  = "; statObj.Crash;
    ? " Time spent: "; statObj.Time; "ms"
    ? ""
    ? ""
    if (statObj.Total = statObj.Correct)
        overrallResult = "Success"
    else
        overrallResult = "Fail"
    end if
    ? "RESULT: "; overrallResult

end sub

'----------------------------------------------------------------
' Create an empty statistic object for totals in output log.
'
' @return An empty statistic object.
'----------------------------------------------------------------
function RBS_LOGGER_CreateTotalStatistic() as Object
    statTotalItem = {
        Suites      : []
        Time        : 0
        Total       : 0
        Correct     : 0
        Fail        : 0
        Crash       : 0
    }

    return statTotalItem
end function

'----------------------------------------------------------------
' Create an empty statistic object for test suite with specified name.
'
' @param name (string) A test suite name for statistic object.
'
' @return An empty statistic object for test suite.
'----------------------------------------------------------------
function RBS_LOGGER_CreateSuiteStatistic(name as String) as Object
    statSuiteItem = {
        Name    : name
        Tests   : []
        Time    : 0
        Total   : 0
        Correct : 0
        Fail    : 0
        Crash   : 0
    }

    return statSuiteItem
end function

'----------------------------------------------------------------
' Create statistic object for test with specified name.
'
' @param name (string) A test name.
' @param result (string) A result of test running.
' Posible values: "Success", "Fail".
' Default value: "Success"
' @param time (integer) A test running time.
' Default value: 0
' @param errorCode (integer) An error code for failed test.
' Posible values:
'     252 (&hFC) : ERR_NORMAL_END
'     226 (&hE2) : ERR_VALUE_RETURN
'     233 (&hE9) : ERR_USE_OF_UNINIT_VAR
'     020 (&h14) : ERR_DIV_ZERO
'     024 (&h18) : ERR_TM
'     244 (&hF4) : ERR_RO2
'     236 (&hEC) : ERR_RO4
'     002 (&h02) : ERR_SYNTAX
'     241 (&hF1) : ERR_WRONG_NUM_PARAM
' Default value: 0
' @param errorMessage (string) An error message for failed test.
'
' @return A statistic object for test.
'----------------------------------------------------------------
function RBS_LOGGER_CreateTestStatistic(name as String, result = "Success" as String, time = 0 as Integer, errorCode = 0 as Integer, errorMessage = "" as String) as Object
    statTestItem = {
        Name    : name
        Result  : result
        Time    : time
        Error   : {
            Code    : errorCode
            Message : errorMessage
        }
    }

    return statTestItem
end function

'----------------------------------------------------------------
' Append test statistic to test suite statistic.
'
' @param statSuiteObj (object) A target test suite object.
' @param statTestObj (object) A test statistic to append.
'----------------------------------------------------------------
sub RBS_LOGGER_AppendTestStatistic(statSuiteObj as Object, statTestObj as Object)
    if RBS_CMN_IsAssociativeArray(statSuiteObj) and RBS_CMN_IsAssociativeArray(statTestObj)
        statSuiteObj.Tests.Push(statTestObj)

        if RBS_CMN_IsInteger(statTestObj.time)
            statSuiteObj.Time = statSuiteObj.Time + statTestObj.Time
        end if

        statSuiteObj.Total = statSuiteObj.Total + 1

        if lCase(statTestObj.Result) = "success"
            statSuiteObj.Correct = statSuiteObj.Correct + 1
        else if lCase(statTestObj.result) = "fail"
            statSuiteObj.Fail = statSuiteObj.Fail + 1
        else
            statSuiteObj.crash = statSuiteObj.crash + 1
        end if

    end if
end sub

'----------------------------------------------------------------
' Append suite statistic to total statistic object.
'
' @param statTotalObj (object) A target total statistic object.
' @param statSuiteObj (object) A test suite statistic object to append.
'----------------------------------------------------------------
sub RBS_LOGGER_AppendSuiteStatistic(statTotalObj as Object, statSuiteObj as Object)
    if RBS_CMN_IsAssociativeArray(statTotalObj) and RBS_CMN_IsAssociativeArray(statSuiteObj)
        statTotalObj.Suites.Push(statSuiteObj)
        statTotalObj.Time = statTotalObj.Time + statSuiteObj.Time

        if RBS_CMN_IsInteger(statSuiteObj.Total)
            statTotalObj.Total = statTotalObj.Total + statSuiteObj.Total
        end if

        if RBS_CMN_IsInteger(statSuiteObj.Correct)
            statTotalObj.Correct = statTotalObj.Correct + statSuiteObj.Correct
        end if

        if RBS_CMN_IsInteger(statSuiteObj.Fail)
            statTotalObj.Fail = statTotalObj.Fail + statSuiteObj.Fail
        end if

        if RBS_CMN_IsInteger(statSuiteObj.Crash)
            statTotalObj.Crash = statTotalObj.Crash + statSuiteObj.Crash
        end if

    end if
end sub

'----------------------------------------------------------------
' Print test suite statistic.
' 
' @param statSuiteObj (object) A target test suite object to print.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteStatistic(statSuiteObj as Object, hasFailures)
    m.PrintSuiteStart(statSuiteObj.Name)
    
    for each testCase in statSuiteObj.Tests
        if (not hasFailures or ((not m.config.showOnlyFailures) OR testCase.Result <> "Success"))    
            m.PrintTestStatistic(testCase)
        end if
    end for

    ? " |"
end sub

'----------------------------------------------------------------
' Print test statistic.
' 
' @param statTestObj (object) A target test object to print.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestStatistic(testCase as Object)
    m.PrintTestStart(testCase.Name)
    metaTestCase = testCase.metaTestCase
    if (LCase(testCase.Result) <> "success")
        testChar = "-"
        assertIndex = metaTestCase.testResult.failedAssertIndex
        locationLine = StrI(metaTestCase.GetAssertLine(assertIndex)).trim()
    else
        testChar = "|"
        locationLine = StrI(metaTestCase.lineNumber).trim()
    end if
    locationText = testCase.filePath.trim() + "(" + locationLine + ")"
    
    insetText = ""
    if (not metaTestcase.isParamTest)
        messageLine = RBS_LOGGER_FillText(" " + testChar + " |--" + metaTestCase.Name + " : ", ".", 80)
        ? messageLine ; testCase.Result ; "        " ;locationText 
    else if ( metaTestcase.paramTestIndex = 0)
        name = metaTestCase.Name
        if (len(name) > 1 and right(name, 1) = "0")
            name = left(name, len(name) - 1)
        end if
        ? " " + testChar + " |--" + name+ " : "
    end if
    
    if (metaTestcase.isParamTest)
        insetText = "  "
        messageLine = RBS_LOGGER_FillText(" " + testChar + insetText + " |--" + metaTestCase.rawParams + " : ", ".", 80)
        ? messageLine ; testCase.Result ; "        " ;locationText 
    end if

    if LCase(testCase.Result) <> "success"
        ? " | "; insettext ;"  |--Location: "; locationText
        ? " | "; insettext ;"  |--Error Message: "; testCase.Error.Message
    end if

'    m.PrintTestEnd(testCase.Name)
end sub

function RBS_LOGGER_FillText(text as string, fillChar = " ", numChars = 40) as string
    if (len(text) >= numChars)
        text = left(text, numChars - 5) + "..." + fillChar + fillChar
    else
        numToFill= numChars - len(text)
        for i = 0 to numToFill
            text += fillChar
        end for
    end if
    return text
end function
'----------------------------------------------------------------
' Print testting start message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintStart()
    ? ""
    ? "[START TEST REPORT]"
    ? ""
end sub

'----------------------------------------------------------------
' Print testing end message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintEnd()
    ? ""
    ? "[END TEST REPORT]"
    ? ""
end sub

'----------------------------------------------------------------
' Print test suite SetUp message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteSetUp(sName as String)
    if m.verbosity = m.verbosityLevel.verbose
        ? "================================================================="
        ? "===   SetUp "; sName; " suite."
        ? "================================================================="
    end if
end sub


'----------------------------------------------------------------
' Print test suite start message.
'----------------------------------------------------------------

sub RBS_LOGGER_PrintMetaSuiteStart(metaTestSuite)
    ? metaTestSuite.name; " (" ; metaTestSuite.filePath + "(1))"
end sub

'----------------------------------------------------------------
' Print '@It group start message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteStart(sName as String)
'    ? "It "; sName
    ? " |-" ; sName
'    ? ""
end sub

'----------------------------------------------------------------
' Print test suite end message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteEnd(sName as String)
'    ? "==="
'    ? "===   End "; sName
'    ? "================================================================="
End Sub

'----------------------------------------------------------------
' Print test suite TearDown message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteTearDown(sName as String)
    if m.verbosity = m.verbosityLevel.verbose
        ? "================================================================="
        ? "===   TearDown "; sName; " suite."
        ? "================================================================="
    end if
end sub

'----------------------------------------------------------------
' Print test setUp message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestSetUp(tName as String)
    if m.verbosity = m.verbosityLevel.verbose
        ? "----------------------------------------------------------------"
        ? "---   SetUp "; tName; " test."
        ? "----------------------------------------------------------------"
    end if
end sub

'----------------------------------------------------------------
' Print test start message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestStart(tName as String)
'    ? "----------------------------------------------------------------"
'    ? "---   Tests "; tName
'    ? "---"
end sub

'----------------------------------------------------------------
' Print test end message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestEnd(tName as String)
'    ? "---"
'    ? "---   End "; tName; " test."
'    ? "----------------------------------------------------------------"
end sub

'----------------------------------------------------------------
' Print test TearDown message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestTearDown(tName as String)
    if m.verbosity = m.verbosityLevel.verbose
        ? "----------------------------------------------------------------"
        ? "---   TearDown "; tName; " test."
        ? "----------------------------------------------------------------"
    end if
end sub
