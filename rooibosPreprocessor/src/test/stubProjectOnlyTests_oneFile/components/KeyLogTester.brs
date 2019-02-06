function initialize(args) as void
  registerLogger(m.top.id)
  doPretendMethodImpl()
end function

function OnKeyEvent(key as String, press as Boolean) as Boolean
  if press
    if key = "left"
      logDebug("Keypress {0}", key)
    else if key = "right"
      logVerbose("Keypress {0}", key)
    else if key = "up"
      logInfo("Keypress {0}", key)
    else if key = "down"
      logWarn("Keypress {0}", key)
    else if key = "OK"
      doPretendMethodImpl()
    end if
  end if
  return false
end function

function doPretendMethodImpl()
  logMethod("onGetVideos")
  logInfo("retriving videos for category id", 23)
  logVerbose("loading")
  logDebug("using https url is", "http://someurl")
  logDebug("using GET request")
  logInfo("got result json ", {videos:[{id:1, title:"video stuff"}]})
  logWarn("found malformed json for id ", 23)
  logWarn("found malformed json for id ", 24)
  logWarn("found malformed json for id ", 26)
  logInfo("loaded videos")

  logMethod("UpdateView")
  logError("no focus is set, setting to ", m.top)
end function

