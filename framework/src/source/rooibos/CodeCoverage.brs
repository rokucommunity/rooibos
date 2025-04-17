' @ignore
function init()
    m.resolvedMap = {}
    m.top.observeField("entry", "onEntryChange")
    m.top.observeField("save", "onSave")
    m.results = []
end function

' @ignore
function setExpectedMap()
    m.top.expectedMap = "#EXPECTED_MAP#"
end function

' @ignore
function setFilePathMap()
    m.top.filePathMap = "#FILE_PATH_MAP#"
end function

' @ignore
function onEntryChange()
    entry = m.top.entry
    ' defer till later
    m.results.push(entry)
end function

' @ignore
function onSave()
    ? "saving data"
    for each entry in m.results
        if entry <> invalid then
            fileId = entry.f
            lineMap = m.resolvedMap[fileId]

            if lineMap = invalid then
                lineMap = {}
                m.resolvedMap[fileId] = lineMap
            end if
            lineMap[entry.l] = entry.r
        end if
    end for
    m.top.resolvedMap = m.resolvedMap
    setExpectedMap()
    setFilePathMap()
end function
