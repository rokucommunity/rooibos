function __Rooibos_BaseTestReporter_builder()
    instance = {}
    instance.new = function(testRunner)
        m.testRunner = invalid
        m.config = invalid
        m.allStats = invalid
        m.testRunner = testRunner
        m.config = testRunner.config
        m.allStats = testRunner.stats
    end function
    instance.reportResults = function(allStats)
        'override me
    end function
    instance.testLogInfo = function(text)
        'override me
    end function
    instance.testLogError = function(text)
        'override me
    end function
    return instance
end function
function Rooibos_BaseTestReporter(testRunner)
    instance = __Rooibos_BaseTestReporter_builder()
    instance.new(testRunner)
    return instance
end function