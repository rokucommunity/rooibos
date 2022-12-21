function init()
  m.resolvedMap = {}
  m.top.observeField("entry", "onEntryChange")
  m.top.observeField("save", "onSave")

end function

function setExpectedMap()
  m.top.expectedMap = #EXPECTED_MAP#
end function

function setFilePathMap()
  m.top.filePathMap = #FILE_PATH_MAP#
end function

function onEntryChange()
entry = m.top.entry
  if entry <> invalid
    lineMap = m.resolvedMap[entry.f]

    if lineMap = invalid
      lineMap = {}
    end if
    lineMap[entry.l] = entry.r

    m.resolvedMap[entry.f] = lineMap
  end if
end function

function onSave()
  ? "saving data"
  m.top.resolvedMap = m.resolvedMap
  setExpectedMap()
  setFilePathMap()
end function