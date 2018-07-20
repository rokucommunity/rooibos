function UnitTestRuntimeConfig(testsDirectory, maxLinesWithoutSuiteDirective)
    this = {}
    this.testsDirectory = testsDirectory
    this.CreateSuites = RBS_CreateSuites
    this.hasSoloSuites = false
    this.hasSoloGroups = false
    this.hasSoloTests = false
    this.suites = this.CreateSuites(this.testsDirectory, maxLinesWithoutSuiteDirective)
    return this
end function

function RBS_CreateSuites(testsDirectory, maxLinesWithoutSuiteDirective)
    result =  CreateObject("roArray", 0, true)
    testsFileRegex = CreateObject("roRegex", "^[0-9a-z\_]*\.brs$", "i")

    if testsDirectory <> ""
        fileSystem = CreateObject("roFileSystem")
        listing = fileSystem.GetDirectoryListing(testsDirectory)
        for each item in listing
            itemPath = testsDirectory + "/" + item
            itemStat = fileSystem.Stat(itemPath)

            if itemStat.type = "directory" then
                result.append(m.CreateSuites(itemPath, maxLinesWithoutSuiteDirective))
            else if testsFileRegex.IsMatch(item) then
'                ? "processing file " ; itemPath
                suite = UnitTestSuite(itemPath, maxLinesWithoutSuiteDirective)
                if (suite.isValid)
                    if (suite.isSolo)
                        m.hasSoloSuites = true
                    end if
                    if (suite.hasSoloTests)
                        m.hasSoloTests = true
                    end if
                    if (suite.hasSoloGroups)
                        m.hasSoloGroups = true
                    end if
'                    ? "valid - suite"
                    result.Push(suite)
                else 
'                    ? "suite was not valid - ignoring"
                end if
            end if
        end for
    end if
    return result
end function