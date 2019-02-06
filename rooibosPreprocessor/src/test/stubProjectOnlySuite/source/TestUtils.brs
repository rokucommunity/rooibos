
sub AddTestUtils(testCase)
    'add your own test utils you want access to when testing here
    'e.g.
    testCase.testUtils = TU_MakeTestUtils()
    'testCase._ = rodash()
    'etc etc
end sub

Function TU_MakeTestUtils() as Object
    return {
      SayHello:TU_SayHello
    }
  
End Function

Function TU_SayHello(name) as Void
    ? " hello " ; name
End Function