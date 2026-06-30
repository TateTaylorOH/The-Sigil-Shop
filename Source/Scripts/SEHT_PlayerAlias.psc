Scriptname SEHT_PlayerAlias extends ReferenceAlias  

Formlist Property SEHT_SigilShopPlaceholderItems Auto
Formlist Property SEHT_SigilShopRealItems Auto

ObjectReference selfRef
SEHT_Startup ManagerQuest

Event OnInit()
	AddInventoryEventFilter(SEHT_SigilShopPlaceholderItems)
	selfRef = GetReference()
	ManagerQuest = GetOwningQuest() as SEHT_Startup
endEvent

Event OnItemAdded(Form akBaseItem, int aiItemCount, ObjectReference akItemReference, ObjectReference akSourceContainer)
	int index = SEHT_SigilShopPlaceholderItems.find(akBaseItem)
	if(index > -1)
		Form f = SEHT_SigilShopRealItems.GetAt(index)
		selfRef.RemoveItem(akBaseItem, aiItemCount, true)
		selfRef.AddItem(f, aiItemCount, true)
	endIf
endEvent

Event OnPlayerLoadGame()
	ManagerQuest.CheckCompatibility()
endEvent