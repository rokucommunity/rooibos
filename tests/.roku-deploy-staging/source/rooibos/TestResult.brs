function __Rooibos_TestResult_builder()
    instance = {}
    instance.new = function(test)
        m.isFail = false
        m.isCrash = false
        m.message = ""
        m.lineNumber = - 1
        m.test = invalid
        m.time = 0
        m.test = test
    end function
    instance.reset = function() as void
        m.isFail = false
        m.isCrash = false
        m.time = 0
        m.message = ""
        m.lineNumber = - 1
    end function
    instance.fail = function(message as string, lineNumber = - 1)
        if message <> "" and not m.isFail then
            if not m.isFail then
                m.lineNumber = lineNumber
                m.isFail = true
            end if
        end if
    end function
    instance.crash = function(message as string, lineNumber = - 1)
        if message <> "" and not m.isCrash then
            if not m.isCrash then
                m.lineNumber = lineNumber
                m.isFail = true
                m.isCrash = true
            end if
        end if
    end function
    instance.getMessage = function() as string
        if m.isFail then
            if m.message <> invalid then
                return m.message
            else
                return "unknown test failure"
            end if
        else if m.isCrash then
            if m.message <> invalid then
                return m.message
            else
                return "unknown test crash"
            end if
        else
            return ""
        end if
    end function
    instance.getStatusText = function()
        if m.isFail then
            return "FAIL"
        else if m.isCrash then
            return "CRASH"
        else
            return "PASS"
        end if
    end function
    return instance
end function
function Rooibos_TestResult(test)
    instance = __Rooibos_TestResult_builder()
    instance.new(test)
    return instance
end function