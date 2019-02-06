function UnitTestRuntimeConfig()
  this = {}
  this.CreateSuites = RBS_CreateSuites
  this.hasSoloSuites = false
  this.hasSoloGroups = false
  this.hasSoloTests = false
  this.suites = this.CreateSuites()
  return this
end function

function RBS_CreateSuites()
  suites = RBSFM_getTestSuitesForProject()
  includedSuites = []
  for i = 0 to suites.count() -1
    suite = suites[i]
    if (suite.valid)
      if (suite.isSolo)
        m.hasSoloSuites = true
      end if
      if (suite.hasSoloTests = true)
        m.hasSoloTests = true
      end if
      if (suite.hasSoloGroups = true)
        m.hasSoloGroups = true
      end if
      '          ? "valid - suite"
      includedSuites.Push(suite)
    else
      ? "ERROR! suite was not valid - ignoring"
    end if

  end for
  return includedSuites
end function