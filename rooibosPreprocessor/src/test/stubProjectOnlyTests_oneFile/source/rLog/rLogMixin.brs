'@Namespace rLogM rLogMixin

' /**
'  * @member initializeRLog
'  * @memberof module:RLogMixin
'  * @instance
'  * @description creates rLog, and places it on global
'  *              expects to have access to globalNode on m.global (i.e. from within an SG control)
'  *              to disable logging, simply never call initializeRLog - and your app will
'  *              not incur any logging costs beyond the initial method invocation
'  * @returns {RLog} RLog instance for further configuration
'  */
function initializeRLog(isForcedOff = false, isLightForcedOn = false, isLightForcedOff = false) as object
  rLog = CreateObject("roSGNode", "rLog")
  m.global.addFields({"rLog": rLog})
  rLog.isLightForcedOff = isLightForcedOff
  rLog.isLightForcedOn = isLightForcedOn
  rLog.isForcedOff = isForcedOff
  return rLog
end function

' /**
'  * @member registerLogger
'  * @memberof module:rLogMixin
'  * @instance
'  * @description registers this object (module/SGNode - whatever m is) as a logger
'  *              using the light logger, which will only print
'  *              use this for performance sensitive situation
'  *              note - filtering of levels is not yet supported
'  * @param {string} name of the logger
'  * @param {boolean} isLight - if true, then a cheap print logger is used for performance reasons
'  * @returns {object} object which had log applied to it
'  *                   (target, or m if target was invalid and using a light logger)
'  */
function registerLogger(name = "general", isLight = false, target = invalid) as object
  if target = invalid
    target = m
    isSettingOnModule = false
  else 
    isSettingOnModule = true
  end if

  target.rLog_name = name
  target.rLog_levelTexts = ["[ERROR]","[WARN]","[INFO]","[VERBOSE]","[DEBUG]"]
  target.rLog_isLight = isLight
  target.rLog_instance = m.global.rLog
  target.logImpl = logImpl
  if isSettingOnModule = true
    target.logDebug = logDebug
    target.logVerbose = logVerbose
    target.logInfo = logInfo
    target.logMethod = logMethod
    target.logWarn = logWarn
    target.logError = logError
  end if
  return target
end function

function logDebug(message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(4, message, value, value2, value3, value4, value5, value6, value7, value8, value9)
end function

function logVerbose(message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(3, message, value, value2, value3, value4, value5, value6, value7, value8, value9)
end function

function logInfo(message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(2, message, value, value2, value3, value4, value5, value6, value7, value8, value9)
end function

function logWarn(message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(1, message, value, value2, value3, value4, value5, value6, value7, value8, value9)
end function

function logError(message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(0, message, value, value2, value3, value4, value5, value6, value7, value8, value9)
end function

function logMethod(methodName, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#") as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  m.logImpl(2, methodName, value, value2, value3, value4, value5, value6, value7, value8, value9, true)
end function

function logImpl(level, message, value = "#RLN#", value2 = "#RLN#", value3 = "#RLN#", value4 = "#RLN#", value5 = "#RLN#", value6 = "#RLN#", value7 = "#RLN#", value8 = "#RLN#", value9 = "#RLN#", isMethod = false) as void
  if m.rLog_instance = invalid or m.rLog_instance.isForcedOff = true then return
  if m.rLog_name <> invalid
    name = m.rLog_name
  else
    name = "General"
  end if

  if m.rLog_instance.isLightForcedOn = true
    isLight= true
  else if m.rLog_instance.isLightForcedOff = true
    isLight = false
  else
    isLight = m.rLog_isLight
  end if

  if isLight = true
    if isMethod = true
      print "*[METHOD] " ; name ; "." ; message ; " " ; rLog_ToString(value) ; " " ; rLog_ToString(value2) ; " " ; rLog_ToString(value3) ; " " ; rLog_ToString(value4) ;
      print " " ; rLog_ToString(value5) ; " " ; rLog_ToString(value6) ; " " ; rLog_ToString(value7) ; " " ; rLog_ToString(value8) ; " " ; rLog_ToString(value9)
    else
      print "*"; m.rLog_levelTexts[level] ; " " ; name ; " " ; message ; " " ; rLog_ToString(value) ; " " ; rLog_ToString(value2) ; " " ; rLog_ToString(value3) ; " " ; rLog_ToString(value4) ;
      print " " ; rLog_ToString(value5) ; " " ; rLog_ToString(value6) ; " " ; rLog_ToString(value7) ; " " ; rLog_ToString(value8) ; " " ; rLog_ToString(value9)
    end if
    return
  else
    if isMethod = true
      text = "[METHOD] " + name + "." + rLog_ToString(message) + " " + rLog_ToString(value) + " " + rLog_ToString(value2) + " " + rLog_ToString(value3) + " " + rLog_ToString(value4) + " " + rLog_ToString(value5) + " " + rLog_ToString(value6) + " " + rLog_ToString(value7) + " " + rLog_ToString(value8) + " " + rLog_ToString(value9)
    else
      text = m.rLog_levelTexts[level] + " " + name + " " + rLog_ToString(message) + " " + rLog_ToString(value) + " " + rLog_ToString(value2) + " " + rLog_ToString(value3) + " " + rLog_ToString(value4) + " " + rLog_ToString(value5) + " " + rLog_ToString(value6) + " " + rLog_ToString(value7) + " " + rLog_ToString(value8) + " " + rLog_ToString(value9)
    end if

    logEntry = {
      "name" : name
      "level" : level
      "text" : text
    }
    m.rLog_instance.callFunc("logItem", logEntry)
    ' m.rLog_instance.logEntry = arglogEntry
  end if
end function

function rLog_ToString(value as dynamic) as string
  valueType = type(value)

  if valueType = "<uninitialized>"
    return "UNINIT"
  else if value = invalid
    return "INVALID"
  else if GetInterface(value, "ifString") <> invalid
    if value = "#RLN#"
      return ""
    else
      return value
    end if
  else if valueType = "roInt" or valueType = "roInteger" or valueType = "Integer"
    return value.tostr()
  else if GetInterface(value, "ifFloat") <> invalid
    return Str(value).Trim()
  else if valueType = "roSGNode"
    return "Node(" + value.subType() +")"
  else if valueType = "roAssociativeArray"
    return "AA(" + formatJson(value) + ")"
  else if valueType = "roBoolean" or valueType = "Boolean"
    return value.tostr()
  else
    return ""
  end if
end function