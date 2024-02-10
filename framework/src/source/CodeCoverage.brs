#const rooibos_poc_enhanced_lcov_support = false

function init()
  m.resolvedMap = {}
  m.resolvedTestMap = {}
  m.top.observeField("entry", "onEntryChange")
  m.top.observeField("save", "onSave")
  m.resultsByTest = {}
  m.results = []
end function

function setExpectedMap()
  m.top.expectedMap = "#EXPECTED_MAP#"
end function

function setFilePathMap()
  m.top.filePathMap = "#FILE_PATH_MAP#"
end function

function onEntryChange()
  entry = m.top.entry
  ' defer till later

  #if rooibos_poc_enhanced_lcov_support
    testName = m.top.testName
    if testName <> ""
      if not m.resultsByTest.doesExist(testName)
        m.resultsByTest[testName] = []
      end if
      m.resultsByTest[testName].push(entry)
    end if
  #end if

  m.results.push(entry)
end function

function onSave()
  ? "saving data"
  for each entry in m.results
    if entry <> invalid
      fileId = entry.f
      lineMap = m.resolvedMap[fileId]

      if lineMap = invalid
        lineMap = {}
        m.resolvedMap[fileId] = lineMap
      end if
      lineMap[entry.l] = entry.r
    end if
  end for
  m.top.resolvedMap = m.resolvedMap

  #if rooibos_poc_enhanced_lcov_support
    for each testName in m.resultsByTest
      resolvedTest = m.resultsByTest[testName]
      m.resolvedTestMap[testName] = {}
      for each entry in resolvedTest
        if entry <> invalid
          fileId = entry.f
          lineMap = m.resolvedTestMap[testName][fileId]

          if lineMap = invalid
            lineMap = {}
            m.resolvedTestMap[testName][fileId] = lineMap
          end if
          lineMap[entry.l] = entry.r
        end if
      end for
    end for
    m.top.resolvedTestMap = m.resolvedTestMap
  #end if
  setExpectedMap()
  setFilePathMap()
end function