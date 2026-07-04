scriptname SEHT_Injector extends Quest

LeveledItem[] Property WrapperLItems Auto
Form[] Property RealItems Auto

LeveledItem Property SEHT_DLC1VendorLItemMorvenVendorItems Auto
FormList Property SEHT_SigilShopPlaceholderItems Auto
FormList Property SEHT_SigilShopRealItems Auto

Event OntInit()
	Debug.Messagebox("Script fired!")
	int i = 0
	while(i < WrapperLItems.length)
		LeveledItem Wrapper = WrapperLItems[i]
		Form RealForm = None
		if(i < RealItems.length)
			RealForm = RealItems[i]
			Debug.Messagebox("RealItems[i] = " + RealItems[i].GetName())
		endIf
		if(RealForm) ; placeholde and real case
			Form PlaceholderItem = Wrapper.GetNthForm(0)
			SEHT_SigilShopPlaceholderItems.AddForm(PlaceholderItem)
			SEHT_SigilShopRealItems.AddForm(RealForm)
			SEHT_DLC1VendorLItemMorvenVendorItems.AddForm(Wrapper, 1, 1)
			Debug.Messagebox(RealForm.GetName() + " added!")
		else ; real only case
			SEHT_DLC1VendorLItemMorvenVendorItems.AddForm(Wrapper, 1, 1)
		endIf
		i += 1
	endWhile
endEvent