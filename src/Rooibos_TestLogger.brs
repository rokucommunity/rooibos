function Logger(config) as object
  this = {}
  this.config = config

  this.verbosityLevel = {
    basic   : 0
    normal  : 1
    verbose : 2
  }

  ' Internal properties
  this.verbosity        = this.config.logLevel

  ' Interface
  this.PrintStatistic     = RBS_LOGGER_PrintStatistic
  this.PrintMetaSuiteStart  = RBS_LOGGER_PrintMetaSuiteStart
  this.PrintSuiteStatistic  = RBS_LOGGER_PrintSuiteStatistic
  this.PrintTestStatistic   = RBS_LOGGER_PrintTestStatistic
  this.PrintStart       = RBS_LOGGER_PrintStart
  this.PrintEnd         = RBS_LOGGER_PrintEnd
  this.PrintSuiteStart    = RBS_LOGGER_PrintSuiteStart

  return this
end function

'----------------------------------------------------------------
' Print statistic object with specified verbosity.
'
' @param statObj (object) A statistic object to print.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintStatistic(statObj as object)
  m.PrintStart()
  previousfile = invalid

  for each testSuite in statObj.Suites
    if (not statObj.testRunHasFailures or ((not m.config.showOnlyFailures) or testSuite.fail > 0 or testSuite.crash > 0))
      if (testSuite.metaTestSuite.filePath <> previousfile)
        m.PrintMetaSuiteStart(testSuite.metaTestSuite)
        previousfile = testSuite.metaTestSuite.filePath
      end if
      m.PrintSuiteStatistic(testSuite, statObj.testRunHasFailures)
    end if
  end for

  ? ""
  m.PrintEnd()

  ? "Total  = "; RBS_CMN_AsString(statObj.Total); " ; Passed  = "; statObj.Correct; " ; Failed   = "; statObj.Fail; " ; Ignored   = "; statObj.Ignored
  ? " Time spent: "; statObj.Time; "ms"
  ? ""
  ? ""

  if (statObj.ignored > 0)
    ? "IGNORED TESTS:"
    for each ignoredItemName in statObj.IgnoredTestNames
      print ignoredItemName
    end for
  end if

  if (statObj.Total = statObj.Correct)
    overrallResult = "Success"
  else
    overrallResult = "Fail"
  end if
  ? "RESULT: "; overrallResult

end sub

'----------------------------------------------------------------
' Print test suite statistic.
'
' @param statSuiteObj (object) A target test suite object to print.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteStatistic(statSuiteObj as object, hasFailures)
  m.PrintSuiteStart(statSuiteObj.Name)

  for each testCase in statSuiteObj.Tests
    if (not hasFailures or ((not m.config.showOnlyFailures) or testCase.Result <> "Success"))
      m.PrintTestStatistic(testCase)
    end if
  end for

  ? " |"
end sub

sub RBS_LOGGER_PrintTestStatistic(testCase as object)
  metaTestCase = testCase.metaTestCase

  if (LCase(testCase.Result) <> "success")
    testChar = "-"
    assertIndex = metaTestCase.testResult.failedAssertIndex
    locationLine = StrI(RBS_TC_GetAssertLine(metaTestCase,assertIndex)).trim()
  else
    testChar = "|"
    locationLine = StrI(metaTestCase.lineNumber).trim()
  end if
  locationText = "pkg:/" + testCase.filePath.trim() + "(" + locationLine + ")"

  insetText = ""
  if (metaTestcase.isParamTest <> true)
    messageLine = RBS_LOGGER_FillText(" " + testChar + " |--" + metaTestCase.Name + " : ", ".", 80)
    ? messageLine ; testCase.Result ; " (" + stri(metaTestCase.time).trim() +"ms)"
  else if ( metaTestcase.paramTestIndex = 0)
    name = metaTestCase.Name
    if (len(name) > 1 and right(name, 1) = "0")
      name = left(name, len(name) - 1)
    end if
    ? " " + testChar + " |--" + name+ " : "
  end if

  if (metaTestcase.isParamTest = true)
    insetText = "  "
    messageLine = RBS_LOGGER_FillText(" " + testChar + insetText + " |--" + formatJson(metaTestCase.rawParams) + " : ", ".", 80)
    ? messageLine ; testCase.Result ; " (" + stri(metaTestCase.time).trim() +"ms)"
  end if

  if LCase(testCase.Result) <> "success"
    ? " | "; insettext ;"  |--Location: "; locationText
    if (metaTestcase.isParamTest = true)
      ? " | "; insettext ;"  |--Param Line: "; StrI(metaTestCase.paramlineNumber).trim()
    end if
    ? " | "; insettext ;"  |--Error Message: "; testCase.Error.Message
  end if
end sub

function RBS_LOGGER_FillText(text as string, fillChar = " ", numChars = 40) as string
  if (len(text) >= numChars)
    text = left(text, numChars - 5) + "..." + fillChar + fillChar
  else
    numToFill= numChars - len(text) -1
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
sub RBS_LOGGER_PrintSuiteSetUp(sName as string)
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
  ? metaTestSuite.name; " " ; "pkg:/" ; metaTestSuite.filePath + "(1)"
end sub

'----------------------------------------------------------------
' Print '@It group start message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteStart(sName as string)
  '  ? "It "; sName
  ? " |-" ; sName
  '  ? ""
end sub

'----------------------------------------------------------------
' Print test suite TearDown message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintSuiteTearDown(sName as string)
  if m.verbosity = m.verbosityLevel.verbose
    ? "================================================================="
    ? "===   TearDown "; sName; " suite."
    ? "================================================================="
  end if
end sub

'----------------------------------------------------------------
' Print test setUp message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestSetUp(tName as string)
  if m.verbosity = m.verbosityLevel.verbose
    ? "----------------------------------------------------------------"
    ? "---   SetUp "; tName; " test."
    ? "----------------------------------------------------------------"
  end if
end sub

'----------------------------------------------------------------
' Print test TearDown message.
'----------------------------------------------------------------
sub RBS_LOGGER_PrintTestTearDown(tName as string)
  if m.verbosity = m.verbosityLevel.verbose
    ? "----------------------------------------------------------------"
    ? "---   TearDown "; tName; " test."
    ? "----------------------------------------------------------------"
  end if
end sub
