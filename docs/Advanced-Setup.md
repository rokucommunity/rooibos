### Global test setup

I find it really handy to have my own BaseTestSuite, that extends `Rooibos.BaseTestSuite` and I use that as the base of all my tests. In this way I can easily use common utilities and use common beforeEach/setup for setting things up.

You can always call the super beforeEach/setup/teardown/etc from your other tests, making it trivial to do global setup functions.


#### Example Node test file

In the following example, the tests will be run in a new (auto-generated) component that extends `NodeExample` component.

```
namespace Tests
  @SGNode NodeExample
  @suite [NET] Node Example Tests
  class NodeExampleTests extends Rooibos.BaseTestSuite
    override function setup()
      m.setupThing = "something created during setup"
    end function

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("tests methods present on the node")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    override function beforeEach()
      m.beforeEachThing = "something created beforeEach"
    end function

    @it("HelloFromNode")
    function helloFromNode_simple()
      'bs:disable-next-line
      text = HelloFromNode("georgejecook", 12)
      m.assertEqual(text, "HELLO georgejecook" + " age:" + stri(12))
    end function
...
```

### Nuances of testing nodes
The behaviour of your unit tests is identical to unit testing any other class, with 2 caveates:

1. `m` does not refer to your node, it refers to the test suite, as per normal testing. The following variables are available to you in your test as a convenience:

  - `m.node` - codebehind for your xml file (e.g. your brs's m)
  - `m.top` the node you are testing
  - `m.global` access to the global node
2. You **cannot** stub node methods. If there is no `.` reference to a method (via an associated array style object), then Rooibos cannot mock it. You may consider refactoring your code in these cases, as imho, it's better practice for things that you want to mock, to not be in the glue code of your code behdind files, in any case
3. If you use mixins, which use eval to locate methods by name (common practice if you are doing anything complex) then be aware that the eval namespace is NOT the code in your unit test; but the code in your node's brs file and your test node's brs file. If you need to add more methods, such as callbck stubs, you can add them to the .brs file of your test.