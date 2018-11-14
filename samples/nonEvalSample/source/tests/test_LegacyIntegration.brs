Function testSuite_LegacyIntegration()
  this = BaseTestSuite()

  this.Name = "LegacyIntegrationTestSuite"

  this.SetUp = LegacyIntegrationTestSuite_SetUp

  this.addTest("simpleResult", testCase_LegacyIntegration_simpleResult)
  this.addTest("multipleAsserts", testCase_LegacyIntegration_multipleAsserts)
  return this
End Function


Function LegacyIntegrationTestSuite_SetUp()
  m.testData = {"key": "value"}
End Function

Function testCase_LegacyIntegration_simpleResult()
  return m.AssertNotInvalid(m.testData)
End Function


Function testCase_LegacyIntegration_multipleAsserts()
  result = m.AssertNotInvalid(m.testData)
  result += m.AssertEqual(m.testdata.key, "value")
End Function
