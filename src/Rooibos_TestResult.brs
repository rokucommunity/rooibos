function UnitTestResult() as object
  this = {}
  this.messages = CreateObject("roArray", 0, true)
  this.isFail = false
  this.currentAssertIndex = 0
  this.failedAssertIndex = 0
  this.Reset = RBS_TRes_Reset
  this.AddResult = RBS_TRes_AddResult
  this.GetResult = RBS_TRes_GetResult
  return this
end function 

function RBS_TRes_Reset() as void
  m.isFail = false
  m.messages = CreateObject("roArray", 0, true)
end function

function RBS_TRes_AddResult(message as string) as string
  if (message <> "")
    m.messages.push(message)
    if (not m.isFail)
      m.failedAssertIndex = m.currentAssertIndex
    end if
    m.isFail = true
  end if
  m.currentAssertIndex++
  return message  
end function

function RBS_TRes_GetResult() as string
  if (m.isFail)
    msg = m.messages.peek()
    if (msg <> invalid)
      return msg
    else
      return "unknown test failure"
    end if
  else
    return ""
  end if
end function