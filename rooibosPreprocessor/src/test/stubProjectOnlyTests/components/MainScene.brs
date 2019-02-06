function Init() as void
  m.top._rLog = initializeRlog()
   
  CreateObject("roSGNode", "RALETrackerTask")
  keyLoggerOne = m.top.findNode("KeyLogTesterOne")
  keyLoggerTwo = m.top.findNode("KeyLogTesterTwo")
  keyLoggerThree = m.top.findNode("KeyLogTesterThree")
  
  keyLoggerOne.callFunc("initialize", invalid)
  keyLoggerTwo.callFunc("initialize", invalid)
  keyLoggerThree.callFunc("initialize", invalid)
  keyLoggerThree.setFocus(true)
end function

'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
'@It tests myService
'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

'@Test connects to server
'@Params[0, 23, true]
function MST_myService_testToServer()
  m.Fail("implement me!")
  m.expectNone(myThing, "sdffds")
  m.expectOnce(myThing, sdfds, [methodArgs], result)
  
end function