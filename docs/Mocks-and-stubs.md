<a name="mocks-and-stubs"></a>
Rooibos can be used for integration, behavior, unit testing, and TDD. In many cases (particularly TDD and unit testing), we will not want to execute all of the methods invoked by our code; but will instead prefer to mock and stub those method calls.

In other cases, it may simply be impractical to execute code as part of our tests. Examples can be executing method that make network calls, require hardware, or playback, or just simply take to long.

In all of these cases, you can use Rooibos's mocks and stubs in place of real method calls.

#### [Fakes](../docs/Mocks-and-stubs:-fakes.md)
#### [Stubs](./docs/Mocks-and-stubs:-stubs.md)
#### [Mocks](./docs/Mocks-and-stubs:-mocks.md)





