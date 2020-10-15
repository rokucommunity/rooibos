function Rooibos_Coverage_createLCovOutput()
    print "Generating lcov.info file..."
    cc = m.global._rbs_ccn
    expectedMap = cc.expectedMap
    filePathMap = cc.filePathMap
    resolvedMap = cc.resolvedMap
    buffer = ""
    for each module in filePathMap.items()
        moduleNumber = module.key
        filePath = module.value
        packageName = "."
        relativePath = filePath.replace("pkg:", packageName)
        sanitizedPath = relativePath.replace("\\", "/")
        buffer = buffer + "TN:" + chr(10)
        buffer = buffer + "SF:" + sanitizedPath + chr(10)
        for each expected in expectedMap[moduleNumber]
            lineNumber = expected[0]
            SHIFT = 1
            if resolvedMap[moduleNumber] <> invalid and resolvedMap[moduleNumber].doesExist(str(lineNumber)) then
                buffer = buffer + "DA:" + str(lineNumber + SHIFT) + ",1" + chr(10)
            else
                buffer = buffer + "DA:" + str(lineNumber + SHIFT) + ",0" + chr(10)
            end if
        end for
        buffer = buffer + "end_of_record" + chr(10)
    end for
    return buffer
end function

function Rooibos_Coverage_printLCovInfo()
    print ""
    print "+++++++++++++++++++++++++++++++++++++++++++"
    print "LCOV.INFO FILE"
    print "+++++++++++++++++++++++++++++++++++++++++++"
    print ""
    print "+-=-coverage:start"
    print Coverage.createLCovOutput()
    print "+-=-coverage:end"
end function