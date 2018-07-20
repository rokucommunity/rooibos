function Init() as void
    m.nameText = m.top.findNode("nameText")
end function

function HelloFromNode(name) as string
    return "HELLO " + name
end function

function UpdateState(newState) as void
    m.top.state = newState 
end function

function SetLabelText(newText) as void
    m.nameText.text = newText
end function