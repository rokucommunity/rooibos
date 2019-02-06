'@Namespace rLogST rLogScreenTransport  

function rLogScreenTransport(rLog)
  screenLogger = CreateObject("roSGNode", "rLogScreenTransport")
  rLog._screenLogger = screenLogger
  return {
    "screenLogger": screenLogger
    managesFiltering: false
    log: rLogST_log
  }
end function

function rLogST_log(args)
  m.screenLogger.logLine = args.text
end function

