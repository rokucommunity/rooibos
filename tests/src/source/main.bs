sub Main(args as dynamic)
  ? "Launching with args "
  ? args
  m.args = args
  
  ' if (type(Rooibos__Init) = "Function") then Rooibos__Init(invalid, invalid, invalid, m)
  InitScreen()
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

  'do any other stuff here that _must_ be done in main
  'I'm not a fan of that though; but just showing how it would work
  rootScene.callFunc("begin", m.args)

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