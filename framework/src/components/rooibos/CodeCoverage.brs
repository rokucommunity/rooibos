function init()
    ' The coverage map ships as a JSON asset rather than an embedded literal: a real app's
    ' map can exceed Roku's 2MiB-per-.brs-file compile limit (&hb9) when written into code.
    m.coverageMap = ParseJson(ReadAsciiFile("pkg:/components/rooibos/CodeCoverage.json"))
    m.port = createObject("roMessagePort")
    m.top.observeFieldScoped("entry", m.port)
    ' save arrives on the same port so the task thread can block on wait() instead of
    ' polling m.top.save (a cross-thread rendezvous) on a sleep loop
    m.top.observeFieldScoped("save", m.port)
    m.top.functionName = "runTaskThread"
    m.top.control = "RUN"
end function

function runTaskThread() as void
    ' Per-file line lookups keyed by line number, built lazily on first hit (on the task
    ' thread, so the render thread never pays for index construction). The values are
    ' references to the same line AAs as file.lines, so mutating them updates the model.
    m.lineIndexByFile = {}
    while true
        events = []
        saving = false
        ' blocking wait: zero CPU and no cross-thread field reads while idle
        message = wait(0, m.port)
        if message.getField() = "save" then
            saving = (message.getData() = true)
        else
            events.push(message)
        end if
        if saving = true then
            ? "Saving unprocessed code cov events..."
            'Drain all the unprocessed messages (3ms grace per message, then done)
            while true
                message = wait(3, m.port)
                if message = invalid then
                    exit while
                else if message.getField() <> "save" then
                    events.push(message)
                end if
            end while

            ? "Found" events.count() " unprocessed events..."
        end if

        ' enum CodeCoverageLineType
        '     noCode = 0
        '     code = 1
        '     condition = 2
        '     branch = 3
        '     function = 4
        ' end enum

        for each event in events
            entry = event.getData()
            if entry <> invalid then
                file = m.coverageMap.files[entry.f]
                if entry.r = 4 then ' CodeCoverageLineType.function
                    if file.functions[entry.fn].totalHit = 0 then
                        file.functionTotalHit++
                    end if
                    file.functions[entry.fn].totalHit++
                else if entry.r = 3 then ' CodeCoverageLineType.branch
                    ' branch ids are assigned as array indexes at build time, so index directly
                    branch = file.blocks[entry.bl].branches[entry.br]
                    if branch <> invalid then
                        if branch.totalHit = 0 then
                            file.branchTotalHit++
                        end if
                        branch.totalHit++
                    end if
                else if entry.r = 1 then ' CodeCoverageLineType.code
                    fileKey = stri(entry.f).trim()
                    lineIndex = m.lineIndexByFile[fileKey]
                    if lineIndex = invalid then
                        lineIndex = {}
                        for each line in file.lines
                            lineIndex[stri(line.lineNumber).trim()] = line
                        end for
                        m.lineIndexByFile[fileKey] = lineIndex
                    end if
                    line = lineIndex[stri(entry.l).trim()]
                    if line <> invalid then
                        if line.totalHit = 0 then
                            file.lineTotalHit++
                        end if
                        line.totalHit++
                    end if
                end if
                ' no write-back needed: file and its members are references into m.coverageMap
            end if
        end for

        if saving = true then
            m.top.coverageResults = m.coverageMap
            return
        end if
    end while

end function


#if false
    sub test()
        player = m.player

        report = false
        if player = invalid or (player.duration > 0 and player.state = "playing") then
            report = true
        end if

        if report = true then
            player.control = "stop"
        end if
    end sub


    sub test()
        player = m.player

        report = false
        if RBS_CC_0_reportCondition(109, 1, player = invalid) or RBS_CC_0_reportCondition(109, 2, (RBS_CC_0_reportCondition(109, 3, player.duration > 0) and RBS_CC_0_reportCondition(109, 4, player.state = "playing"))) then
            report = true
        end if

        if report = true then
            player.control = "stop"
        end if
    end sub
#end if
