'@Namespace rLogPT rLog PrintTransport

function PrintTransport(rLog)
  return {
    _rLog : rLog
    log: rLogPT_log
    managesFiltering: false
  }
end function

function rLogPT_log(args)
  print args.text
end function