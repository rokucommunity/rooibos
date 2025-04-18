function SomeModel() as object
    if m._someModel = invalid then

        obj = {}
        obj.appTitle = ""
        obj._config = invalid
        obj.updatedConfig = invalid

        obj.globalMockExample = function()
            appTitle = getManifestValue("title")
            m.appTitle = appTitle
        end function

        obj.setUpdatedConfig1 = function()
            m.updatedConfig = m._getConfig()
        end function

        obj.setUpdatedConfig2 = function()
            m.updatedConfig = m._getConfig()
        end function

        obj._getConfig = function() as object
            return m._config
        end function

        m._someModel = obj
    end if

    return m._someModel
end function

function getManifestValue(key as string) as string
    return createObject("roAppInfo").getValue(key)
end function
