Scriptname SEHT_MerchantContainerAlias extends ReferenceAlias

Keyword Property SEHT_SigilShopUniqueItem Auto

SEHT_ListManager ListManager

Event OnInit()
	AddInventoryEventFilter(SEHT_SigilShopUniqueItem)
	ListManager = GetOwningQuest() as SEHT_ListManager
endEvent

Event OnItemRemoved(Form akBaseItem, int aiItemCount, ObjectReference akItemReference, ObjectReference akDestContainer)
	ListManager.RemoveUniqueItem(akBaseItem)
endEvent