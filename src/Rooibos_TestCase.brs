' /**
'  * @module TestCase
'  */
function UnitTestCase(name as string, func as dynamic, isSolo as boolean, isIgnored as boolean, lineNumber as integer, isNodeTest as boolean, nodeTestFile ="" as string, params = invalid, paramTestIndex =0)
    this = {}
    this.isSolo = isSolo
    this.func = func
    this.isIgnored = isIgnored
    this.name = name
    this.lineNumber = lineNumber
    this.assertIndex = 0
    this.nodeTestFile = nodeTestFile
    'Map with which the testsuite processor can take the index of a an assert line, and map it to the line Number
    this.assertLineNumberMap = {}
    this.AddAssertLine = RBS_TC_AddAssertLine
    this.GetAssertLine = RBS_TC_GetAssertLine
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

function RBS_TC_GetAssertLine(index)
    if (m.assertLineNumberMap.doesExist(stri(index).trim()))
        return m.assertLineNumberMap[stri(index).trim()]
    else
        return m.lineNumber
    end if
end function
