# Rooibos snippets for VsCode

If you are using Willow Tree's [excellent visual studio code plugin](https://marketplace.visualstudio.com/items?itemName=willowtree.vscode-ide-brightscript), then place the following snippets in your `brightscript.json` to get autocompletion hints for brightscript. 

Ther eare snippets for common tasks, such as setting up your test suites, groups and cases, annotations, and asserts.

## Supported snippets

### General

 - testSuite
 - setUp
 - tearDown
 - beforeEach
 - afterEach
 - itGroup
 - test
 - ignore
 - only
 - params

### Asserts

 - assertFalse
 - assertTrue
 - assertEqual
 - assertLike
 - assertNotEqual
 - assertInvalid
 - assertNotInvalid
 - assertAAHasKey
 - assertAANotHasKey
 - assertAAHasKeys
 - assertAANotHasKeys
 - assertArrayContains
 - assertArrayNotContains
 - assertArrayContainsSubset
 - assertArrayContainsAAs
 - assertArrayNotContainsSubset
 - assertArrayCount
 - assertArrayNotCount
 - assertEmpty
 - assertNotEmpty
 - assertArrayContainsOnlyValuesOfType
 - assertType
 - assertSubType
 - assertNodeCount
 - assertNodeNotCount
 - assertNodeEmpty
 - assertNodeNotEmpty
 - assertNodeContains
 - assertNodeNotContains
 - assertNodeContainsFields
 - assertNodeNotContainsFields
 - assertAAContainsSubset
 - assertMocks

```
//rooibos snippets
	"rooibos beforeEach": {
		"prefix": "beforeEach",
		"body": [
			"'@BeforeEach",
			"function ${2:namespace}_${3:itGroup}_beforeEach()",
			"\t$0",
			"end function",
		]
	},
	"rooibos afterEach": {
		"prefix": "afterEach",
		"body": [
			"'@AfterEach",
			"function ${2:namespace}_${3:itGroup}_afterEach()",
			"\t$0",
			"end function",
		]
	},
	"rooibos setup": {
		"prefix": "setup",
		"body": [
			"'@Setup",
			"function ${2:namespace}_setup()",
			"\t$0",
			"end function",
		]
	},
	"rooibos tearDown": {
		"prefix": "tearDown",
		"body": [
			"'@TearDown",
			"function ${2:namespace}_tearDown()",
			"\t$0",
			"end function",
		]
	},
	"rooibos ignore": {
		"prefix": "ignore",
		"body": [
			"'@Ignore ${1:reason}",
			"$0"
		]
	},
	"rooibos only": {
		"prefix": "only",
		"body": [
			"'@Only",
			"$0"
		]
	},
	"rooibos testSuite": {
		"prefix": "testSuite",
		"body": [
			"'@TestSuite ${1:namespace} $2{2:description}",
			"$0"
		]
	},
	"rooibos testcase": {
		"prefix": "test",
		"body": [
			"'@Test ${1:description}",
			"function ${2:namespace}_${3:itGroup}_${4:testName}()",
			"\tm.Fail(\"implement me!\")",
			"\t$0",
			"end function",
		]
	},
	"rooibos params": {
		"prefix": "params",
		"body": [
			"'@Params[${1:values}]$0",
		]
	},
	"rooibos it": {
		"prefix": "it",
		"body": [
			"'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
			"'@It tests ${1:groupName}",
			"'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
			"",
			"$0"
		]
	},
	//rooibos mocks and stubs
	"rooibos stub": {
		"prefix": "stub",
		"body": [
			"m.stub(${1:target}, \"${2:methodName}\", [${3:methodArgs}], ${4:result})",
			"$0"
		]
	},
	"rooibos mock": {
		"prefix": "expect",
		"body": [
			"${1:mockName} = m.mock(${2:target}, \"${3:methodName}\", ${4:expectedNumberOfcalls}, [${5:methodArgs}], ${6:result})",
			"$0"
		]
	},
	"rooibos expect": {
		"prefix": "expect",
		"body": [
			"m.expectOnce(${1:target}, \"${2:methodName}\", ${3:expectedNumberOfcalls}, [${4:methodArgs}], ${5:result})",
			"$0"
		]
	},
	"rooibos expectOnce": {
		"prefix": "expectOnce",
		"body": [
			"m.expectOnce(${1:target}, \"${2:methodName}\", [${3:methodArgs}], ${4:result})",
			"$0"
		]
	},
	"rooibos expectNone": {
		"prefix": "expectNone",
		"body": [
			"m.expectNone(${1:target}, \"${2:methodName}\")",
			"$0"
		]
	},
	//stubs and mocks on non-defined methods
	"rooibos stub force": {
		"prefix": "stubForce",
		"body": [
			"m.stub(${1:target}, \"${2:methodName}\", [${3:methodArgs}], ${4:result}, true)",
			"$0"
		]
	},
	"rooibos mock force": {
		"prefix": "expectForce",
		"body": [
			"${1:mockName} = m.mock(${2:target}, \"${3:methodName}\", ${4:expectedNumberOfcalls}, [${5:methodArgs}], ${6:result}, true)",
			"$0"
		]
	},
	"rooibos expect force": {
		"prefix": "expectForce",
		"body": [
			"m.expectOnce(${1:target}, \"${2:methodName}\", ${3:expectedNumberOfcalls}, [${4:methodArgs}], ${5:result}, true)",
			"$0"
		]
	},
	"rooibos expectOnce force": {
		"prefix": "expectOnceForce",
		"body": [
			"m.expectOnce(${1:target}, \"${2:methodName}\", [${3:methodArgs}], ${4:result}, true)",
			"$0"
		]
	},
	"rooibos expectNone force": {
		"prefix": "expectForce",
		"body": [
			"m.expectNone(${1:target}, \"${2:methodName}\", true)",
			"$0"
		]
	},
	// Rooibos asserts
	"rooibos AssertFalse": {
		"prefix": "assertFalse",
		"body": [
			"m.assertFalse(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertTrue": {
		"prefix": "assertTrue",
		"body": [
			"m.assertTrue(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertEqual": {
		"prefix": "assertEqual",
		"body": [
			"m.assertEqual(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertLike": {
		"prefix": "assertLike",
		"body": [
			"m.assertLike(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNotEqual": {
		"prefix": "assertNotEqual",
		"body": [
			"m.assertNotEqual(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertInvalid": {
		"prefix": "assertInvalid",
		"body": [
			"m.assertInvalid(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNotInvalid": {
		"prefix": "assertNotInvalid",
		"body": [
			"m.assertNotInvalid(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertAAHasKey": {
		"prefix": "assertAAHasKey",
		"body": [
			"m.assertAAHasKey(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertAANotHasKey": {
		"prefix": "assertAANotHasKey",
		"body": [
			"m.assertAANotHasKey(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertAAHasKeys": {
		"prefix": "assertAAHasKeys",
		"body": [
			"m.assertAAHasKeys(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertAANotHasKeys": {
		"prefix": "assertAANotHasKeys",
		"body": [
			"m.assertAANotHasKeys(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayContains": {
		"prefix": "assertArrayContains",
		"body": [
			"m.assertArrayContains(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayNotContains": {
		"prefix": "assertArrayNotContains",
		"body": [
			"m.assertArrayNotContains(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayContainsSubset": {
		"prefix": "assertArrayContainsSubset",
		"body": [
			"m.assertArrayContainsSubset(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayContainsAAs": {
		"prefix": "assertArrayContainsAAs",
		"body": [
			"m.assertArrayContainsAAs(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayNotContainsSubset": {
		"prefix": "assertArrayNotContainsSubset",
		"body": [
			"m.assertArrayNotContainsSubset(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayCount": {
		"prefix": "assertArrayCount",
		"body": [
			"m.assertArrayCount(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayNotCount": {
		"prefix": "assertArrayNotCount",
		"body": [
			"m.assertArrayNotCount(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertEmpty": {
		"prefix": "assertEmpty",
		"body": [
			"m.assertEmpty(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNotEmpty": {
		"prefix": "assertNotEmpty",
		"body": [
			"m.assertNotEmpty(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertArrayContainsOnlyValuesOfType": {
		"prefix": "assertArrayContainsOnlyValuesOfType",
		"body": [
			"m.assertArrayContainsOnlyValuesOfType(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertType": {
		"prefix": "assertType",
		"body": [
			"m.assertType(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertSubType": {
		"prefix": "assertSubType",
		"body": [
			"m.assertSubType(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeCount": {
		"prefix": "assertNodeCount",
		"body": [
			"m.assertNodeCount(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeNotCount": {
		"prefix": "assertNodeNotCount",
		"body": [
			"m.assertNodeNotCount(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeEmpty": {
		"prefix": "assertNodeEmpty",
		"body": [
			"m.assertNodeEmpty(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeNotEmpty": {
		"prefix": "assertNodeNotEmpty",
		"body": [
			"m.assertNodeNotEmpty(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeContains": {
		"prefix": "assertNodeContains",
		"body": [
			"m.assertNodeContains(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeNotContains": {
		"prefix": "assertNodeNotContains",
		"body": [
			"m.assertNodeNotContains(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeContainsFields": {
		"prefix": "assertNodeContainsFields",
		"body": [
			"m.assertNodeContainsFields(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertNodeNotContainsFields": {
		"prefix": "assertNodeNotContainsFields",
		"body": [
			"m.assertNodeNotContainsFields(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertAAContainsSubset": {
		"prefix": "assertAAContainsSubset",
		"body": [
			"m.assertAAContainsSubset(${1:value}, ${2:expected})",
			"$0"
		]
	},
	"rooibos AssertMocks": {
		"prefix": "assertMocks",
		"body": [
			"m.assertMocks(${1:value}, ${2:expected})",
			"$0"
		]
	},
	// end rooibos asserts
	
```
