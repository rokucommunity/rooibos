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
    ' Entries whose ids don't resolve in the model. Any nonzero count means the package
    ' mixes instrumentation passes (e.g. stale staged files from an earlier build whose
    ' baked-in ids alias different files in this build's CodeCoverage.json) - skip and
    ' tally rather than crash the task.
    m.unmatchedEntries = 0
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

        ' entry.r values below are force-substituted at build time from the TS
        ' CodeCoverageLineType enum (FileFactory.createCoverageComponent keys on the
        ' #LINE_TYPE_*# markers), so producer and consumer cannot drift. The literals
        ' here only matter for parsing this template standalone.

        for each event in events
            entry = event.getData()
            if entry <> invalid then
                file = m.coverageMap.files[entry.f]
                if file = invalid then
                    m.unmatchedEntries++
                else if entry.r = 4 then ' #LINE_TYPE_FUNCTION#
                    func = file.functions[entry.fn]
                    if func <> invalid then
                        if func.totalHit = 0 then
                            file.functionTotalHit++
                        end if
                        func.totalHit++
                    else
                        m.unmatchedEntries++
                    end if
                else if entry.r = 3 then ' #LINE_TYPE_BRANCH#
                    ' branch ids are assigned as array indexes at build time, so index directly
                    block = file.blocks[entry.bl]
                    branch = invalid
                    if block <> invalid then
                        branch = block.branches[entry.br]
                    end if
                    if branch <> invalid then
                        if branch.totalHit = 0 then
                            file.branchTotalHit++
                        end if
                        branch.totalHit++
                    else
                        m.unmatchedEntries++
                    end if
                else if entry.r = 1 then ' #LINE_TYPE_CODE#
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
                    else
                        m.unmatchedEntries++
                    end if
                end if
                ' no write-back needed: file and its members are references into m.coverageMap
            end if
        end for

        if saving = true then
            if m.unmatchedEntries > 0 then
                ? "[rooibos coverage] WARNING: " ; stri(m.unmatchedEntries).trim() ; " coverage entries did not match the coverage model and were skipped."
                ? "[rooibos coverage] This usually means the package mixes files from different builds - rebuild into a clean staging directory."
            end if
            m.top.coverageResults = m.coverageMap
            return
        end if
    end while

end function
