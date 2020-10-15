function __Rooibos_RuntimeConfig_builder()
    instance = {}
    instance.new = sub()
    end sub
    instance.getVersionText = function()
        return "4.0.0-b9"
    end function
    instance.getRuntimeConfig = function()
        
    return {
      "failFast": false
      "logLevel": 0
      "showOnlyFailures": false
      "printLcov": false
      "port": "invalid"
    }
    end function
    instance.getTestSuiteClassWithName = function(name)
        if false then
        else if name = "Rooibos assertion tests" then
            return Tests_AssertionTests
        end if
    end function
    instance.getAllTestSuitesNames = function()
        return [
        "Rooibos assertion tests"
      ]
    end function
    instance.getIgnoredTestInfo = function()
        return {
          "count": 0
          "items":[
        
  ]}
  
    end function
    return instance
end function
function Rooibos_RuntimeConfig()
    instance = __Rooibos_RuntimeConfig_builder()
    instance.new()
    return instance
end function