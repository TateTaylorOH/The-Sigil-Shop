scriptname SEHT_Injector extends Quest

LeveledItem Property WrapperLItem Auto
Armor Property RealArmor Auto
Weapon Property RealWeapon Auto
Form Property RealOther Auto

LeveledItem Property SEHT_DLC1VendorLItemMorvenVendorItems Auto
FormList Property SEHT_SigilShopPlaceholderItems Auto
FormList Property SEHT_SigilShopRealItems Auto

function RunInjection()
	if(RealArmor || RealWeapon || RealOther) ; placeholde and real case
		Form PlaceholderItem = WrapperLItem.GetNthForm(0)
		Form RealForm = RealArmor
		if(!RealForm)
			RealForm = RealWeapon
		endIf
		if(!RealForm)
			RealForm = RealOther
		endIf
		if(!RealForm)
			return
		endIf
		SEHT_SigilShopPlaceholderItems.AddForm(PlaceholderItem)
		SEHT_SigilShopRealItems.AddForm(RealForm)
		SEHT_DLC1VendorLItemMorvenVendorItems.AddForm(WrapperLItem, 1, 1)
	else ; real only case
		SEHT_DLC1VendorLItemMorvenVendorItems.AddForm(WrapperLItem, 1, 1)
	endIf
endFunction
