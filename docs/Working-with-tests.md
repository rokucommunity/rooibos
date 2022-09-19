There are many articles on the benefits of TDD, and how to go about TDD, which you can readily find, such as [this link](https://builttoadapt.io/why-tdd-489fdcdda05e) which has a good overview, plus a great video with warnings of how to take it too far.

Personally, I get great mileage doing TDD in roku by using MVVM pattern (I'm soon to release a lightweight MVVM framework). You can get more info on that [here](https://medium.com/flawless-app-stories/how-to-use-a-model-view-viewmodel-architecture-for-ios-46963c67be1b) (for iOS), and ideas on how that benefits roku dev [here](https://medium.com/plexlabs/xml-code-good-times-rsg-application-b963f0cec01b)

I use these practices as much as possible because:

1. Keeps my view and business logic separated
2. Tests are super fast to run (I generally run about 400 or so in each of my projects in < 5 seconds, and when running 1 test, turn around time is < 3 seconds)
3. I can test all of my logic and ideas out in isolation, before I start up my app, navigate to the correct page
4. Easy to mock my code, so that I can test a broad range of network conditions
5. I get a Regression test suite as I write my code
6. It's really the quickest way to develop. In my 20+ years professional experience those who follow TDD (or some less-strict form of it) write far more, and far better code than their counterparts, and their projects end up being way more maintainable over the years.

Personally, I like to have my test in one window, the code I'm testing in another, and a third window with a telnet session, showing my testing output. This is especially handy, as Rooibos hyperlinks to the lines that assertions fail on, so I can easily navigate straight to the problematic tests.

E.g.

![Simple test output](./images/TestingExample.png)

I slap an `@only` annotation on the suite, group and test I'm currently working on, and have a hotkey to run my tests.

Once my test passes, I test for regression, then run the whole suite, then run the app and test out in the UI.