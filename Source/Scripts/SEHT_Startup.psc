Scriptname SEHT_Startup extends Quest

Actor Property PlayerRef Auto
Perk Property SEHT_FortifyCriticalDamagePerk Auto
Perk Property SEHT_ResistCriticalDamagePerk Auto

;compatibility
;Elven Hunter
bool property ElvenHunterFound Auto Hidden
string property ElvenHunterFilename = "ccbgssse064-ba_elven.esl" autoreadonly
GlobalVariable Property SEHT_UniqueAreldursArmorChanceNone Auto
Armor Property SEHT_ArmorUniqueAreldursArmor Auto
Armor Property SEHT_ShopItemUniqueAreldursArmor Auto
GlobalVariable Property SEHT_UniqueConjurersGlovesChanceNone Auto
Armor Property SEHT_ArmorUniqueConjurersGloves Auto
Armor Property SEHT_ShopItemUniqueConjurersGloves Auto
ArmorAddon Property ElvenHunterCloneCuirassAA Auto
ArmorAddon Property ElvenHunterCloneGlovesAA Auto
;Steel Soldier
bool property SteelSoldierFound Auto Hidden
string property SteelSoldierFilename = "ccbgssse058-ba_steel.esl" autoreadonly
GlobalVariable Property SEHT_UniquePaladinsHelmetChanceNone Auto
Armor Property SEHT_ArmorUniquePaladinsHelmet Auto
Armor Property SEHT_ShopItemUniquePaladinsHelmet Auto
GlobalVariable Property SEHT_UniquePaladinsMailChanceNone Auto
Armor Property SEHT_ArmorUniquePaladinsMail Auto
Armor Property SEHT_ShopItemUniquePaladinsMail Auto
ArmorAddon Property SteelSoldierCloneCuirassAA Auto
ArmorAddon Property SteelSoldierCloneHelmetAA Auto
ArmorAddon Property SteelSoldierCloneHelmetArgonianAA Auto
ArmorAddon Property SteelSoldierCloneHelmetKhajiitAA Auto
;Ghosts
bool property GhostsFound Auto Hidden
string property GhostsFilename = "ccasvsse001-almsivi.esm" autoreadonly
GlobalVariable Property SEHT_UniqueBreathtakerChanceNone Auto
Weapon Property SEHT_WeaponUniqueBreathtaker Auto
Weapon Property SEHT_ShopItemUniqueBreathtaker Auto
Static Property GhostsClone1stPersonMagebane Auto

Event OnInit()
	;add perks
	PlayerRef.AddPerk(SEHT_FortifyCriticalDamagePerk)
	PlayerRef.AddPerk(SEHT_ResistCriticalDamagePerk)
	ElvenHunterFound = Game.IsPluginInstalled(ElvenHunterFilename)
	SteelSoldierFound = Game.IsPluginInstalled(SteelSoldierFilename)
	GhostsFound = Game.IsPluginInstalled(GhostsFilename)
	if(!ElvenHunterFound)
		PatchOutElvenHunter()
	endIf
	if(!SteelSoldierFound)
		PatchOutSteelSoldier()
	endIf
	if(!GhostsFound)
		PatchOutGhosts()
	endIf
endEvent

function CheckCompatibility()
	ElvenHunterFound = Game.IsPluginInstalled(ElvenHunterFilename)
	SteelSoldierFound = Game.IsPluginInstalled(SteelSoldierFilename)
	GhostsFound = Game.IsPluginInstalled(GhostsFilename)
	if(!ElvenHunterFound)
		PatchOutElvenHunter()
	endIf
	if(!SteelSoldierFound)
		PatchOutSteelSoldier()
	endIf
	if(!GhostsFound)
		PatchOutGhosts()
	endIf
endFunction

function PatchOutElvenHunter()
	SEHT_UniqueAreldursArmorChanceNone.SetValue(100.0)
	SEHT_ArmorUniqueAreldursArmor.SetModelPath("Armor\\Elven\\M\\CuirassHeavyGND.nif", false)
	SEHT_ShopItemUniqueAreldursArmor.SetModelPath("Armor\\Elven\\M\\CuirassHeavyGND.nif", false)
	
	SEHT_UniqueConjurersGlovesChanceNone.SetValue(100.0)
	SEHT_ArmorUniqueConjurersGloves.SetModelPath("Armor\\Elven\\M\\GauntletsGND.nif", false)
	SEHT_ShopItemUniqueConjurersGloves.SetModelPath("Armor\\Elven\\M\\GauntletsGND.nif", false)
	
	ElvenHunterCloneCuirassAA.SetModelPath("Armor\\Elven\\M\\Cuirass_1.nif", false, false)
	ElvenHunterCloneCuirassAA.SetModelPath("Armor\\Elven\\M\\1stPersonCuirass_1.nif", true, false)
	ElvenHunterCloneCuirassAA.SetModelPath("Armor\\Elven\\F\\Cuirass_1.nif", false, true)
	ElvenHunterCloneCuirassAA.SetModelPath("Armor\\Elven\\F\\1stPersonCuirass_1.nif", true, true)
	
	ElvenHunterCloneGlovesAA.SetModelPath("Armor\\Elven\\M\\Gauntlets_0.nif", false, false)
	ElvenHunterCloneGlovesAA.SetModelPath("Armor\\Elven\\M\\1stPersonGauntlets_1.nif", true, false)
	ElvenHunterCloneGlovesAA.SetModelPath("Armor\\Elven\\F\\Gauntlets_0.nif", false, true)
	ElvenHunterCloneGlovesAA.SetModelPath("Armor\\Elven\\F\\1stPersonGauntlets_1.nif", true, true)
endFunction

function PatchOutSteelSoldier()
	SEHT_UniquePaladinsHelmetChanceNone.SetValue(100.0)
	SEHT_ArmorUniquePaladinsHelmet.SetModelPath("Armor\\NordPlate\\Helmet_GO.nif", false)
	SEHT_ShopItemUniquePaladinsHelmet.SetModelPath("Armor\\NordPlate\\Helmet_GO.nif", false)
	
	SEHT_UniquePaladinsMailChanceNone.SetValue(100.0)
	SEHT_ArmorUniquePaladinsMail.SetModelPath("Armor\\NordPlate\\Cuirass_GO.nif", false)
	SEHT_ShopItemUniquePaladinsMail.SetModelPath("Armor\\NordPlate\\Cuirass_GO.nif", false)
	
	SteelSoldierCloneCuirassAA.SetModelPath("Armor\\Steel\\Cuirass_1.nif", false, false)
	SteelSoldierCloneCuirassAA.SetModelPath("Armor\\Steel\\1stPersonCuirass_1.nif", true, false)
	SteelSoldierCloneCuirassAA.SetModelPath("Armor\\Steel\\F\\Cuirass_1.nif", false, true)
	SteelSoldierCloneCuirassAA.SetModelPath("Armor\\Steel\\F\\1stPersonCuirass_1.nif", true, true)
	
	SteelSoldierCloneHelmetAA.SetModelPath("Armor\\Steel\\Helmet_1.nif", false, false)
	SteelSoldierCloneHelmetAA.SetModelPath("Armor\\Steel\\Helmet_1.nif", false, true)
	
	SteelSoldierCloneHelmetArgonianAA.SetModelPath("Armor\\Steel\\Helmet_Arg_1.nif", false, false)
	SteelSoldierCloneHelmetArgonianAA.SetModelPath("Armor\\Steel\\Helmet_Arg_1.nif", false, true)
	
	SteelSoldierCloneHelmetKhajiitAA.SetModelPath("Armor\\Steel\\Helmet_Kha_1.nif", false, false)
	SteelSoldierCloneHelmetKhajiitAA.SetModelPath("Armor\\Steel\\Helmet_Kha_1.nif", false, true)
endFunction

function PatchOutGhosts()
	SEHT_UniqueBreathtakerChanceNone.SetValue(100.0)
	SEHT_WeaponUniqueBreathtaker.SetModelPath("Weapons\\Glass\\GlassGreatSword.nif")
	SEHT_ShopItemUniqueBreathtaker.SetModelPath("Weapons\\Glass\\GlassGreatSword.nif")
	GhostsClone1stPersonMagebane.SetWorldModelPath("Weapons\\Glass\\1stPersonGlassGreatSword.nif")
endFunction