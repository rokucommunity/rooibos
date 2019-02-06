function Init() as void
  m.transportImpls = []
  m.top.filters = []
  m.top.excludeFilters = []
  m.top.transports = ["printTransport"]
  m.top.functionName = "execRunLoop"
  m.pendingItems = []
  m.top.control="run"
end function

function execRunLoop()
  port = CreateObject("roMessagePort")
  m.top.observeField("logEntry", port)

  while true
    msg = wait(0, port)
    if type(msg) = "roSGNodeEvent"
      field = msg.getField()
      data = msg.getData()
      if (field = "logEntry")
        if (data <> invalid)
          ' addItemToPending(data)
          logItem(data)
        end if
      end if
    end if
  end while
end function

function onLogEntryChange() as void
  if m.top.logEntry <> invalid
    addItemToPending(m.top.logEntry)
  end if
end function

function addItemToPending(item) as void
  m.pendingItems.push(item)
  if m.pendingItems.count() > 20
    for i = 0 to m.pendingItems.count() -1
      logItem(m.pendingItems[i])
    end for
    m.pendingItems = []
  end if
end function

function logItem(args) as void
  passesFilter = m.top.logLevel >= args.level and matchesFilter(args) and not isExcluded(args)
  passesFilter = true
  for each transport in m.transportImpls
    if not transport.managesFiltering or passesFilter
      transport.log(args)
    end if
  end for
end function

function matchesFilter(args) as boolean
  if m.top.filters.count() = 0
    return true
  else
    for each filter in m.top.filters
      if type(box(filter)) = "roString" and filter = args.name
        return true
      end if
    end for
  end if

  return false
end function

function isExcluded(args) as boolean
  if m.top.excludeFilters.count() = 0
    return false
  else
    for each filter in m.top.excludeFilters
      if type(box(filter)) = "roString" and filter = args.name
        return true
      end if
    end for
  end if

  return false
end function

function onTransportsChange(event)
  print "[METHOD] RLOG.onTransportsChange"
  m.transportImpls = []
  for each transportType in m.top.transports
    transport = getTransport(transportType)
    if transport <> invalid
      m.transportImpls.push(transport)
    else
      print "found illegal transportType " ; transportType
    end if
  end for
end function

function getTransport(transportType)
  if transportType = "printTransport"
    return PrintTransport(m.top)
  else if transportType = "rLogSGTransport"
    return rLogSGTransport(m.top)
  else if transportType = "rLogScreenTransport"
    return rLogScreenTransport(m.top)
  end if
end function