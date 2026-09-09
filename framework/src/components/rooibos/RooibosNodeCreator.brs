function Init()
    ' Forces the current node to become owned by the render thread
    m.global.update({ "__rooibos_node_creator": m.top }, true)
    m.global.removeField("__rooibos_node_creator")
end function

function CreateNode(nodeName as dynamic, parent as dynamic) as dynamic
    return parent.CreateChild(nodeName)
end function
