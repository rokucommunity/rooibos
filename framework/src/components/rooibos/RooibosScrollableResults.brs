function init() as void
    m.rootContent = m.top.findNode("rootContent")
    m.top.itemComponentName = "RooibosResultRow"
    m.top.drawFocusFeedback = false
end function

' Append a result line. args is an associative array with:
'   name        as string  — display text
'   passed      as boolean — true for OK rows, false for failed/error rows
'   failedCount as integer — failures within the suite (failed rows only)
'   totalCount  as integer — total tests run within the suite
function appendLine(args as object) as void
    if args = invalid or args.name = invalid then return

    item = m.rootContent.createChild("ContentNode")
    item.addFields({
        name: ""
        passed: true
        failedCount: 0
        totalCount: 0
    })

    item.name = args.name
    if args.passed <> invalid then item.passed = args.passed
    if args.failedCount <> invalid then item.failedCount = args.failedCount
    if args.totalCount <> invalid then item.totalCount = args.totalCount

    ' Auto-scroll to the new row
    m.top.jumpToItem = m.rootContent.getChildCount() - 1
end function

function clear() as void
    while m.rootContent.getChildCount() > 0
        m.rootContent.removeChildrenIndex(m.rootContent.getChildCount(), 0)
    end while
end function
