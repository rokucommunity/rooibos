function Rooibos_init() as void
    args = {}
    if createObject("roAPPInfo").IsDev() <> true then
        print " not running in dev mode! - rooibos tests only support sideloaded builds - aborting"
        return
    end if
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    testSceneName = "TestsScene"
    print "Starting test using test scene with name TestsScene" ; testSceneName
    scene = screen.CreateScene(testSceneName)
    scene.id = "ROOT"
    screen.show()
    m.global = screen.getGlobalNode()
    m.global.addFields({
        "testsScene": scene
    })
    args.testScene = scene
    args.global = m.global
    if scene.hasField("isReadyToStartTests") and scene.isReadyToStartTests = false then
        print "The scene is not ready yet - waiting for it to set isReadyToStartTests to true"
        scene.observeField("isReadyToStartTests", m.port)
    else
        print "scene is ready; running tests now"
        runner = Rooibos_TestRunner(args, m)
        runner.Run()
    end if
    while (true)
        msg = wait(0, m.port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent" then
            if msg.isScreenClosed() then
                return
            end if
        else if msgType = "roSGNodeEvent" then
            if msg.getField() = "isReadyToStartTests" and msg.getData() = true then
                print "scene is ready; running tests now"
                runner = Rooibos_TestRunner(args, m)
                runner.Run()
            end if
        end if
    end while
end function

function Rooibos_versionCompare(v1, v2)
    v1parts = v1.split(".")
    v2parts = v2.split(".")
    while v1parts.count() < v2parts.count()
        v1parts.push("0")
    end while
    while v2parts.count() < v1parts.count()
        v2parts.push("0")
    end while
    for i = 0 to v1parts.count() - 1
        if v2parts.count() = i then
            return 1
        end if
        if v1parts[i] <> v2parts[i] then
            if v1parts[i] > v2parts[i] then
                return 1
            else
                return - 1
            end if
        end if
    end for
    if v1parts.count() <> v2parts.count() then
        return - 1
    end if
    return 0
end function