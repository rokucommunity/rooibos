function SomeModel() as object
    if m._someModel = invalid

        obj = {}
        obj.appTitle = ""
        obj._config = invalid
        obj.updatedConfig = invalid

        obj.globalMockExample = sub()
            appTitle = getManifestValue("title")
            m.appTitle = appTitle
        end sub

        obj.setUpdatedConfig1 = sub()
            m.updatedConfig = m._getConfig()
        end sub

        obj.setUpdatedConfig2 = sub()
            m.updatedConfig = m._getConfig()
        end sub

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