Scriptname SEHT_Startup extends Quest

SEHT_Debug Property SEHTDebug
	SEHT_Debug function get()
		return (self as Quest) as SEHT_Debug
	endFunction
endProperty

Actor Property PlayerRef Auto
Perk Property SEHT_FortifyCriticalDamagePerk Auto
Perk Property SEHT_ResistCriticalDamagePerk Auto

Event OnInit()
	;add perks
	PlayerRef.AddPerk(SEHT_FortifyCriticalDamagePerk)
	PlayerRef.AddPerk(SEHT_ResistCriticalDamagePerk)
endEvent