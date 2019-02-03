function UnitTestRuntimeConfig()
  this = {}
  this.testsDirectory = testsDirectory
  this.CreateSuites = RBS_CreateSuites
  this.hasSoloSuites = false
  this.hasSoloGroups = false
  this.hasSoloTests = false
  this.suites = this.CreateSuites()
  return this
end function

function RBS_CreateSuites()
  suites = RBSFM_getTestSuitesForProject()
  for i = 0 to suites.length -1
    suite = suites[i]
    if (suite.isValid)
      if (suite.isSolo)
        m.hasSoloSuites = true
      end if
      if (suite.hasSoloTests)
        m.hasSoloTests = true
      end if
      if (suite.hasSoloGroups)
        m.hasSoloGroups = true
      end if
      '          ? "valid - suite"
      result.Push(suite)
    else
      '          ? "suite was not valid - ignoring"
    end if

  end for
  return suites
end function