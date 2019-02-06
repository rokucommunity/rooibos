'@Namespace rLogSGT rLogsceneGraphTransport  

function rLogSGTransport(rLog)
  nodeLogger = CreateObject("roSGNode", "rLogSGTransport")
  nodeLogger.rLog = rLog
  rLog._nodeLogger = nodeLogger
  
  return {
    "log": rLogSGT_log
    managesFiltering: true
  }
end function

function rLogSGT_log(args)
  items = m.nodeLogger._rawItems 
  if items.count() > m.nodeLogger.maxItems
    items.delete(0)
  end if
  item = {"level": args.level, "text":text, "name":args.name}
  items.push(item)
  
  m.nodeLogger._rawItems = items
end function

