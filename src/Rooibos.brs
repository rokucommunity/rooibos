' /**
'  * @module rooibosh
'  */

' /**
'  * @memberof module:rooibosh
'  * @name Rooibos__Init
'  * @function
'  * @description Entry point for rooibos unit testing framework. Will identify, run, and report all tests in the app, before terminating the application.
'  * @param {Dynamic} args - Associative array of args to pass into the test runner
'  * @param {Dynamic} preTestSetup - called to do any initialization once the screen is created
'  *                                   Use this to configure anything such as globals, etc that you need
'  * @param {Dynamic} testUtilsDecorator - will be invoked, with the test case as a param - the function 
'  *                                         can then compose/decorate any additional functionality, as required
'  *                                   Use this to add things like, rodash, common test utils, etc
'  * @param testsSceneName as string - name of scene to create. All unit tests run in the scene thread
'  *                                   and therefore require a screen and scene are created.
'  */ 
function Rooibos__Init(args, preTestSetup = invalid,  testUtilsDecoratorMethodName = invalid, testSceneName = "TestsScene") as void

    if args.RunTests = invalid or args.RunTests <> "true" then
        return
    end if
    
    args.testUtilsDecoratorMethodName = testUtilsDecoratorMethodName
    
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    
    ? "Starting test using test scene with name TestsScene" ; testSceneName
    scene = screen.CreateScene(testSceneName)
    scene.id = "ROOT"
    screen.show()
    
    if (preTestSetup <> invalid)
        preTestSetup(screen)
    end if

    m.global = screen.getGlobalNode()
    
    testId = args.TestId
    if (testId = invalid)
        testId = "UNDEFINED_TEST_ID"
    end if
    
    ? "#########################################################################" 
    ? "#TEST START : ###" ; testId ; "###"

    args.testScene = scene
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
end function




