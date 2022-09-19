#### Stubs
Stubs are Fakes which are not tracked. This means that you can execute your unit tests, using the fake methods; but Rooibos will not fail your tests if things were not as expected (i.e. wrong params, wrong number of invocations). These can be very handy for setting certain test conditions (i.e. you can create a fake network response that will return a speific result, which drives your test)

To create a stub, we use the `stubCall` method:

```
function StubCall(invocation, returnValue = invalid) as object
```

 - invocation is a function pointer on a stubbable object, e.g. detailsVM.executeNetRequest
 - returnValue is the value we wish to return - this can be left out, if we don't return anything (i.e. invalid)

##### A simple example
Given a ViewModel, named DetailsVM, which has a method LoadDetails, as such:
```
function loadDetails()
	isNetworkRequestExecuted = m.executeNetRequest("http://my.data.com/get")
	m.isLoading = isNetworkRequestExecuted
	m.isShowingError = not isNetworkRequestExecuted
end function
```

We can use a stub, to facilitate testing against the network layer

```
detailsVM = createDetailsVM()
returnJson = {success:false}
m.stubCall(detailsVM.executeNetRequest, returnJson)

detailsVM.loadDetails()

m.assertFalse(detailsVM.isLoading)
m.assertTure(detailsVM.isShowingError)
```

In this case, our detailsVM object, will not actually call ExecuteNetRequests's source code; but will instead call a _fake_ (i.e fake method body), which can return predtermined values, or be later checked for invocation arg conformance.