function init()
  m.top.observeField("logLine", "onLogLineChange")
  m.displayedLines = []
  m.scrollableText = m.top.findNode("scrollableText")
end function

function onLogLineChange()
  m.displayedLines.push(left(m.top.logLine, 100))
  
  if m.displayedLines.count() > m.top.maxVisibleLines
    m.displayedLines.delete(0)
  end if

  m.scrollableText.text = m.displayedLines.join(chr(10))
end function