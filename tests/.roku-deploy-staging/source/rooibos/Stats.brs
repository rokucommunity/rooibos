function __Rooibos_Stats_builder()
    instance = {}
    instance.new = function()
        m.time = 0
        m.ranCount = 0
        m.passedCount = 0
        m.failedCount = 0
        m.crashedCount = 0
        m.ignoredCount = 0
        m.ignoredTestNames = []
        m.hasFailures = false
        m.testResult = invalid
    end function
    instance.merge = function(other) as void
        m.time += other.time
        m.ranCount += other.ranCount
        m.passedCount += other.passedCount
        m.failedCount += other.failedCount
        m.crashedCount += other.crashedCount
        m.ignoredCount += other.ignoredCount
        m.ignoredTestNames.append(other.IgnoredTestNames)
        m.onUpdate()
    end function
    instance.appendTestResult = function(result)
        m.time += result.time
        m.ranCount++
        if result.isCrash then
            m.crashedCount++
        else if result.isFail then
            m.failedCount++
        else
            m.passedCount++
        end if
        m.onUpdate()
    end function
    instance.onUpdate = function()
        m.hasFailures = m.failedCount > 0 or m.crashedCount > 0
    end function
    return instance
end function
function Rooibos_Stats()
    instance = __Rooibos_Stats_builder()
    instance.new()
    return instance
end function