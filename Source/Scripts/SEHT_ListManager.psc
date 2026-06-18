Scriptname SEHT_ListManager extends Quest

SEHT_Debug Property SEHTDebug
	SEHT_Debug function get()
		return (self as Quest) as SEHT_Debug
	endFunction
endProperty

LeveledItem Property ManagedList Auto


;a leveled item is considered a wrapper if it has one entry that is the wrappedItem
LeveledItem Function GetWrapperLItem(Form wrappedItem)
	int n = ManagedList.GetNumForms()
	int i = 0
	while i < n
		LeveledItem litem = ManagedList.GetNthForm(i) as LeveledItem
		if(litem && litem.GetNumForms() == 1 && litem.GetNthForm(0) == wrappedItem)
			return litem
		endIf
		i += 1
	endWhile
	return None
endFunction

Function RemoveUniqueItem(Form uniqueItem)
	LeveledItem wrapper = GetWrapperLItem(uniqueItem)
	if(wrapper)
		GlobalVariable ChanceNone = wrapper.GetChanceGlobal()
		if(ChanceNone)
			ChanceNone.SetValue(100.0)
		endIf
	endIf
endFunction
