function UnitTestCase(name as string, func as dynamic, funcName as string, isSolo as boolean, isIgnored as boolean, lineNumber as integer, params = invalid, paramTestIndex =0, paramLineNumber = 0)
  this = {}
  this.isSolo = isSolo
  this.func = func
  this.funcName = funcName
  this.isIgnored = isIgnored
  this.name = name
  this.lineNumber = lineNumber
  this.paramLineNumber = paramLineNumber
  this.assertIndex = 0
  'Map with which the testsuite processor can take the index of a an assert line, and map it to the line Number
  this.assertLineNumberMap = {}
  this.AddAssertLine = RBS_TC_AddAssertLine
  this.getTestLineIndex = 0
  this.rawParams = params
  this.paramTestIndex = paramTestIndex 
  this.isParamTest = false
  if (params <> invalid)
    this.name += stri(this.paramTestIndex)
  end if
  return this
end function

function RBS_TC_AddAssertLine(lineNumber as integer)
  m.assertLineNumberMap[stri(m.assertIndex).trim()] = lineNumber
  m.assertIndex++
end function

'Static, becuase the result might be created across node boundaries, therefore stripping methods
function RBS_TC_GetAssertLine(testCase, index)
  if (testCase.assertLineNumberMap.doesExist(stri(index).trim()))
    return testCase.assertLineNumberMap[stri(index).trim()]
  else
    return testCase.lineNumber
  end if
end function
