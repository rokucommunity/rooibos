sub Main(args as dynamic)
    if  RBS_CC_1_reportLine(1, 2) and ((type(Rooibos__Init) = "Function"))  then Rooibos__Init(SetupGlobals, "AddTestUtils", invalid, m)

RBS_CC_1_reportLine(3, 1):     InitScreen()
end sub

function InitScreen() as void
    'this will be where you setup your typical roku app
    'it will not be launched when running unit tests
RBS_CC_1_reportLine(9, 1):     screen = CreateObject("roSGScreen")
RBS_CC_1_reportLine(10, 1):     m.port = CreateObject("roMessagePort")
RBS_CC_1_reportLine(11, 1):     screen.setMessagePort(m.port)
    
RBS_CC_1_reportLine(13, 1):     rootScene = screen.CreateScene("TestsScene")
RBS_CC_1_reportLine(14, 1):     rootScene.id = "ROOT"
    
RBS_CC_1_reportLine(16, 1):     screen.show()

RBS_CC_1_reportLine(18, 1):     SetupGlobals(screen)
    
RBS_CC_1_reportLine(20, 1):     while(true)
RBS_CC_1_reportLine(21, 1):         msg = wait(0, m.port)
RBS_CC_1_reportLine(22, 1):         msgType = type(msg)
      
        if  RBS_CC_1_reportLine(24, 2) and (msgType = "roSGScreenEvent") 
            if  RBS_CC_1_reportLine(25, 2) and (msg.isScreenClosed())  
RBS_CC_1_reportLine(26, 1):                 return
            end if
        end if
    end while
end function


'*************************************************************
'** SetupGlobals
'** @param screen as roScreen - screen to set globals on
'*************************************************************
function SetupGlobals(screen) as void
RBS_CC_1_reportLine(38, 1):     ? "SETTTING UP GLOBALS - do your standard setup stuff here"

RBS_CC_1_reportLine(40, 1):     m.global = screen.getGlobalNode()

RBS_CC_1_reportLine(42, 1):     m.roDeviceInfo = CreateObject("roDeviceInfo")
    
RBS_CC_1_reportLine(44, 1):     m.displayInfo = {
        resolution: m.roDeviceInfo.GetUIResolution() 
        displayType: m.roDeviceInfo.GetDisplayType() 
        width: m.roDeviceInfo.GetDisplaySize().w
        height: m.roDeviceInfo.GetDisplaySize().h
        wFactor: m.roDeviceInfo.GetDisplaySize().w/1920
        hFactor: m.roDeviceInfo.GetDisplaySize().h/1080
    }

RBS_CC_1_reportLine(53, 1):     m.modelLocator = {"displayInfo":m.displayInfo} ' contrived example : this would be a specifc modelLocator node/other setup thing

RBS_CC_1_reportLine(55, 1):     m.global.addFields({"modelLocator": m.modelLocator})
end function



'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'++ rooibos code coverage util functions DO NOT MODIFY
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function RBS_CC_1_reportLine(lineNumber, reportType = 1)
  if m.global = invalid
    '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    return true
  else
    if m._rbs_ccn = invalid
     '? "Coverage maps are not created - creating now"
      if m.global._rbs_ccn = invalid
        '? "Coverage maps are not created - creating now"
          m.global.addFields({
            "_rbs_ccn": createObject("roSGnode", "CodeCoverage")
          })
      end if
      m._rbs_ccn = m.global._rbs_ccn
     end if
  end if

  m._rbs_ccn.entry = {"f":"1", "l":stri(lineNumber), "r":reportType}
  return true
end function
