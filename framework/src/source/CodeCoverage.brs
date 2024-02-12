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

function getBaseCoverageMap()
  return "#BASE_COVERAGE_REPORT#"
end function

function onEntryChange()
  entry = m.top.entry
  ' defer till later
  m.results.push(entry)
end function

' enum CodeCoverageLineType
'     noCode = 0
'     code = 1
'     condition = 2
'     branch = 3
'     function = 4
' end enum

function onSave()
  ? "saving data"

  ' coverageMap = getBaseCoverageMap()
  m.top.baseCoverageMap = getBaseCoverageMap()
  m.top.resolved = m.results

  ' for each entry in m.results
  '   if entry <> invalid
  '     if entry.r = 4 ' CodeCoverageLineType.function
  '       coverageMap.files[entry.f].functions[entry.fn].totalHit ++
  '     else if entry.r = 3 ' CodeCoverageLineType.branch
  '       for each branch in coverageMap.files[entry.f].blocks[entry.bl].branches
  '         if branch.id = entry.br
  '           branch.totalHit ++
  '           exit for
  '         end if
  '       end for
  '     else if entry.r = 1 ' CodeCoverageLineType.code
  '       for each line in coverageMap.files[entry.f].lines
  '         if line.lineNumber = entry.l
  '           line.totalHit ++
  '           exit for
  '         end if
  '       end for
  '     end if
  '   end if
  ' end for

  ' for each file in coverageMap.files
  '   for each func in file.functions
  '     if func.totalHit > 0 then file.functionTotalHit ++
  '   end for

  '   for each block in file.blocks
  '     for each branch in block.branches
  '       if branch.totalHit > 0 then file.branchTotalHit ++
  '     end for
  '   end for

  '   for each line in file.lines
  '     if line.totalHit > 0 then file.lineTotalHit ++
  '   end for
  ' end for

  ' m.top.results = coverageMap
  ' m.top.resolvedMap = m.resolvedMap

  ' setExpectedMap()
  ' setFilePathMap()
end function

#if false
sub test()
  player = m.player

  report = false
  if player = invalid or (player.duration > 0 and player.state = "playing") then
    report = true
  end if

  if report = true then
    player.control = "stop"
  end if
end sub


sub test()
  player = m.player

  report = false
  if RBS_CC_0_reportCondition(109, 1, player = invalid) or RBS_CC_0_reportCondition(109, 2, (RBS_CC_0_reportCondition(109, 3, player.duration > 0) and RBS_CC_0_reportCondition(109, 4, player.state = "playing"))) then
    report = true
  end if

  if report = true then
    player.control = "stop"
  end if
end sub
#end if