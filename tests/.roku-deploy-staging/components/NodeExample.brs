function Init() as void
    m.nameText = m.top.findNode("nameText")
end function

function HelloFromNode(name, age) as string
    return "HELLO " + name + " age:" + stri(age)
end function

function UpdateState(newState) as void
    m.top.state = newState
end function

function SetLabelText(newText) as void
    m.nameText.text = newText
end function

function r_real_Init() as void
    if m.top.stubs["init"] <> invalid then
        'mock call here
    else
        Init()
    end if
end function

function r_real_HelloFromNode(name, age) as string
    return "HELLO " + name + " age:" + stri(age)
end function

function r_real_UpdateState(newState) as void
    m.top.state = newState
end function

function r_real_SetLabelText(newText) as void
    m.nameText.text = newText
end function