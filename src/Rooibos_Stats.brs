
'----------------------------------------------------------------
' Create an empty statistic object for totals in output log.
'
' @return An empty statistic object.
'----------------------------------------------------------------
function RBS_STATS_CreateTotalStatistic() as Object
    statTotalItem = {
        Suites      : []
        Time        : 0
        Total       : 0
        Correct     : 0
        Fail        : 0
        Ignored     : 0
        Crash       : 0
        IgnoredTestNames: []
    }

    return statTotalItem
end function

'*************************************************************
'** RBS_STATS_MergeTotalStatistic
'** merges the stats from stat2 onto stat1
'** @param param as ObjectP paramdesc
'** @return ObjectR retdesc
'*************************************************************
function RBS_STATS_MergeTotalStatistic(stat1, stat2) as void
    for each suite in stat2.Suites
        stat1.Suites.push(suite)
    end for    
    
    stat1.Time += stat2.Time
    stat1.Total += stat2.Total
    stat1.Correct += stat2.Correct
    stat1.Fail += stat2.Fail
    stat1.Crash += stat2.Crash
    stat1.Ignored += stat2.Ignored
    stat1.IgnoredTestNames.append(stat2.IgnoredTestNames)
end function

'----------------------------------------------------------------
' Create an empty statistic object for test suite with specified name.
'
' @param name (string) A test suite name for statistic object.
'
' @return An empty statistic object for test suite.
'----------------------------------------------------------------
function RBS_STATS_CreateSuiteStatistic(name as String) as Object
    statSuiteItem = {
        Name    : name
        Tests   : []
        Time    : 0
        Total   : 0
        Correct : 0
        Fail    : 0
        Crash   : 0
        Ignored   : 0
        IgnoredTestNames:[]
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
function RBS_STATS_CreateTestStatistic(name as String, result = "Success" as String, time = 0 as Integer, errorCode = 0 as Integer, errorMessage = "" as String) as Object
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
sub RBS_STATS_AppendTestStatistic(statSuiteObj as Object, statTestObj as Object)
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
sub RBS_STATS_AppendSuiteStatistic(statTotalObj as Object, statSuiteObj as Object)
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
