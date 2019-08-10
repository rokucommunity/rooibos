' /**
'  * @module rooibosh
'  */

' /**
'  * @memberof module:rooibosh
'  * @name Rooibos__Init
'  * @function
'  * @description Entry point for rooibos unit testing framework. Will identify, run, and report all tests in the app, before terminating the application.
'  * @param {Dynamic} preTestSetup - called to do any initialization once the screen is created
'  *                   Use this to configure anything such as globals, etc that you need
'  * @param {Dynamic} testUtilsDecorator - will be invoked, with the test case as a param - the function
'  *                     can then compose/decorate any additional functionality, as required
'  *                   Use this to add things like, rodash, common test utils, etc
'  * @param testsSceneName as string - name of scene to create. All unit tests run in the scene thread
'  *                   and therefore require a screen and scene are created.
'  * @param nodeContext as object - this is the global scope of your tests - so where anonymous methods will run from. This should be m
'  */
function Rooibos__Init(preTestSetup = invalid, testUtilsDecoratorMethodName = invalid, testSceneName = invalid, nodeContext = invalid) as void
  args = {}
  if createObject("roAPPInfo").IsDev() <> true then
    ? " not running in dev mode! - rooibos tests only support sideloaded builds - aborting"
    return
  end if
  
  args.testUtilsDecoratorMethodName = testUtilsDecoratorMethodName
  args.nodeContext = nodeContext
  
  screen = CreateObject("roSGScreen")
  m.port = CreateObject("roMessagePort")
  screen.setMessagePort(m.port)
  if testSceneName = invalid
    testSceneName = "TestsScene"
  end if
  ? "Starting test using test scene with name TestsScene" ; testSceneName
  scene = screen.CreateScene(testSceneName)
  scene.id = "ROOT"
  screen.show()
  
  m.global = screen.getGlobalNode()
  m.global.addFields({ "testsScene": scene })
  
  if (preTestSetup <> invalid)
    preTestSetup(screen)
  end if
  
  
  testId = args.TestId
  if (testId = invalid)
    testId = "UNDEFINED_TEST_ID"
  end if
  
  ? "#########################################################################"
  ? "#TEST START : ###" ; testId ; "###"
  
  args.testScene = scene
  args.global = m.global
  rooibosVersion = "3.1.1"
  requiredRooibosPreprocessorVersion = "1.0.0"
  
  if not RBS_CMN_isFunction(RBSFM_getPreprocessorVersion)
    versionError = "You are using a rooibos-preprocessor (i.e. rooibos-cli) version older than 1.0.0 - please update to " + requiredRooibosPreprocessorVersion
  else 
    if RBSFM_getPreprocessorVersion() = requiredRooibosPreprocessorVersion
      versionError = ""
    else
      versionError = "Your rooibos-preprocessor (i.e. rooibos-cli) version '" + RBSFM_getPreprocessorVersion() + "' is not compatible with rooibos version " + rooibosVersion + ". Please upgrade your rooibos-cli to version " + requiredRooibosPreprocessorVersion
    end if 
  end if
  
  if versionError = ""
    ? "######################################################"
    ? ""
    ? "# rooibos framework version: " ; rooibosVersion
    ? "# tests parsed with rooibosC version: " ; rooibosVersion
    ? "######################################################"
    ? ""
    
    runner = RBS_TR_TestRunner(args)
    runner.Run()
    
    while(true)
      msg = wait(0, m.port)
      msgType = type(msg)
      if msgType = "roSGScreenEvent"
        if msg.isScreenClosed()
          return
        end if
      end if
    end while
  else
    ? ""
    ? "#########################################################"
    ? "ERROR - VERSION MISMATCH"
    ? versionError
    ? "#########################################################"
  end if
end function
