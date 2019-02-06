function Init() as void
    'IMPLEMENT ME!
    m.top.logOutput = []
    m.top._rawItems = []
end function


function updateLogOutput(args) as void
    item = m.top.modifiedProgressItem
    
    progressById = m.top.progressById
     
    items = m.top._rawItems
    index = items.count()-1
    loggedTexts = []
    level = m.top.rlog.logLevel 
    filter = m.top.rLog.filters
    excludefilter = m.top.rLog.excludeFilters
    logText = ""
    jsonTexts = []
    while index >= 0
      item = items[index] 
      passesFilter = level >= item.level and matchesFilter(filter, item) and not isExcluded(excludeFilter, item)
    
      if (passesFilter)
        loggedTexts.push(item.text)
        jsonTexts.push(item.text)
        logText += chr(10) +"\n" +item.text
      end if
      index--
    end while
    m.top._logText = logText
    m.top._logOutput = loggedTexts
    m.top._jsonOutput = formatJson(jsonTexts)
end function


function matchesFilter(filters, item) as boolean
  if filters.count() = 0
    return true
  else
    for each filter in filters
      if type(box(filter)) = "roString" and filter = item.name
        return true
      end if
    end for
  end if
  
  return false
end function

function isExcluded(excludeFilters, item) as boolean
  if excludeFilters.count() = 0
    return false
  else
    for each filter in excludeFilters
      if type(box(filter)) = "roString" and filter = item.name
        return true
      end if
    end for
  end if
  
  return false
end function