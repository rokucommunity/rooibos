sub Main(args as dynamic)
    ? "Launching with args "
    ? args
    m.args = args

    if (type(Rooibos__Init) = "Function") then Rooibos__Init(args, SetupGlobals, AddTestUtils)

    InitScreen()
end sub

sub AddTestUtils(testCase)
    'add your own test utils you want access to when testing here
    
    'e.g.
    'testCase.testUtils = TestUtils()
    'testCase.r = rodash()
end sub

function InitScreen() as void
    'this will be where you setup your typical roku app
    'it will not be launched when running unit tests
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    
    rootScene = screen.CreateScene("MainScene")
    rootScene.id = "ROOT"
    
    screen.show()

    SetupGlobals(screen)
    
    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)
      
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() 
                return
            end if
        end if
    end while
end function


'*************************************************************
'** SetupGlobals
'** @param screen as roScreen - screen to set globals on
'*************************************************************
function SetupGlobals(screen) as void
    ? "SETTTING UP GLOBALS - do your standard setup stuff here"

    m.global = screen.getGlobalNode()

    m.roDeviceInfo = CreateObject("roDeviceInfo")
    
    m.displayInfo = {
        resolution: m.roDeviceInfo.GetUIResolution() 
        displayType: m.roDeviceInfo.GetDisplayType() 
        width: m.roDeviceInfo.GetDisplaySize().w
        height: m.roDeviceInfo.GetDisplaySize().h
        wFactor: m.roDeviceInfo.GetDisplaySize().w/1920
        hFactor: m.roDeviceInfo.GetDisplaySize().h/1080
    }

    m.modelLocator = {"displayInfo":m.displayInfo} ' contrived example : this would be a specifc modelLocator node/other setup thing

    m.global.addFields({"modelLocator": m.modelLocator})
end function
