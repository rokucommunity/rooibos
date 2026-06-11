function init() as void
    m.bar = m.top.findNode("bar")
    m.nameLabel = m.top.findNode("nameLabel")
    m.countLabel = m.top.findNode("countLabel")

    m.colors = {
        passBar: "#3ddc97"
        failBar: "#ff5470"
        passName: "#cfcfdc"
        failName: "#ffdcdc"
        focusName: "#6c63ff"
        countText: "#ff5470"
    }
    m.countLabel.color = m.colors.countText

    m.passed = true
    m.failedCount = 0
    m.totalCount = 0
end function

function onItemContentChanged() as void
    content = m.top.itemContent
    if content = invalid then return

    if content.passed = invalid then
        m.passed = true
    else
        m.passed = content.passed
    end if
    m.failedCount = pickInt(content.failedCount, 0)
    m.totalCount = pickInt(content.totalCount, 0)

    name = ""
    if content.name <> invalid then name = content.name
    m.nameLabel.text = name

    if m.passed then
        m.bar.color = m.colors.passBar
    else
        m.bar.color = m.colors.failBar
    end if

    applyDisplay()
end function

function onFocusChanged() as void
    applyDisplay()
end function

function applyDisplay() as void
    focused = m.top.itemHasFocus
    m.nameLabel.color = nameColorFor(focused, m.passed)
    m.countLabel.text = countTextFor(focused, m.passed, m.failedCount, m.totalCount)
end function

function nameColorFor(focused as boolean, passed as boolean) as string
    if focused then return m.colors.focusName
    if passed then return m.colors.passName
    return m.colors.failName
end function

function countTextFor(focused as boolean, passed as boolean, failedCount as integer, totalCount as integer) as string
    if not focused or passed or totalCount <= 0 or failedCount <= 0 then return ""
    if failedCount = totalCount then
        return "all " + totalCount.toStr().trim() + " failed"
    end if
    return failedCount.toStr().trim() + " failed"
end function

function pickInt(value as dynamic, fallback as integer) as integer
    if value = invalid then return fallback
    return value
end function
