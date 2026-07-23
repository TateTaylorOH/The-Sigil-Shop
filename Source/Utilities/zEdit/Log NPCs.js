let recs = xelib.GetRecords(0, "NPC_")
	.map(rec => xelib.GetWinningOverride(rec))
	.sort((a, b) => xelib.GetFormID(a) - xelib.GetFormID(b));
const flagKeys = {
	"Female":						'Female',
	"Essential":					'Essential',
	"Is CharGen Face Preset":		'IsChargenPreset',
	"Essential":					'Essential',
	"Respawn":						'Respawn',
	"Auto-calc stats": 				'AutoCalcStats',
	"Unique": 						'Unique',
	"Doesn't affect stealth meter":	'DoesntAffectStealthMeter',
	"PC Level Mult":				'PCLevelMult',
	"Use Template?":				'UseTemplate',
	"Flag09":						undefined,
	"Flag10":						undefined,
	"Protected":					'Protected',
	"Flag12":						undefined,
	"Flag13":						undefined,
	"Summonable":					'Summonable',
	"Flag15":						undefined,
	"Doesn't bleed":				'DoesntBleed',
	"Flag17":						undefined,
	"Bleedout Override":			'BleedoutOverride',
	"Opposite Gender Anims":		'OppositeGenderAnims',
	"Simple Actor":					'SimpleActor',
	"looped script?":				'LoopedScript',
	"Flag22":						undefined,
	"Flag23":						undefined,
	"Flag24":						undefined,
	"Flag25":						undefined,
	"Unknown 26":					undefined,
	"Flag27":						undefined,
	"looped audio?":				'LoopedAudio',
	"Is Ghost":						'IsGhost',
	"Flag30":						undefined,
	"Invulnerable":					'Invulnerable'
};
const defaultNPCFlags = Object.fromEntries(
	Object.keys(flagKeys)
	.filter(k => flagKeys[k] !== undefined)
	.map(k => [flagKeys[k], false]));
const templateFlagKeys = {
	"Use Traits":			'UseTraits',
	"Use Stats":			'UseStats',
	"Use Factions":			'UseFactions',
	"Use Spell List":		'UseSpellList',
	"Use AI Data":			'UseAIData',
	"Use AI Packages":		'UsePackages',
	"Use Model/Animation?":	'UseModelAnimation',
	"Use Base Data": 		'UseBaseData',
	"Use Inventory": 		'UseInventory',
	"Use Script": 			'UseScript',
	"Use Def Pack List": 	'UseDefaultPackageList',
	"Use Attack Data": 		'UseAttackData',
	"Use Keywords": 		'UseKeywords'
};
const defaultTemplateFlags = Object.fromEntries(
	Object.keys(templateFlagKeys)
	.filter(k => templateFlagKeys[k] !== undefined)
	.map(k => [templateFlagKeys[k], false]));
let data = Object.fromEntries(recs.map(rec => {
	let formID = xelib.GetHexFormID(rec);
	let editorID = xelib.EditorID(rec);
	let NPCRecordFlags = xelib.GetEnabledFlags(rec, "ACBS\\Flags");
	let NPCTemplateFlags = xelib.GetEnabledFlags(rec, "ACBS\\Template Flags");
	let npcFlags = Object.assign({}, defaultNPCFlags);
	NPCRecordFlags.filter(f => f !== '')
		.map(f => flagKeys[f])
		.filter(f => f !== undefined)
		.forEach(f => npcFlags[f] = true);
	let templateFlags = Object.assign({}, defaultTemplateFlags);
	NPCTemplateFlags.filter(f => f !== '')
		.map(f => templateFlagKeys[f])
		.filter(f => f !== undefined)
		.forEach(f => templateFlags[f] = true);
	let deathItem = xelib.HasElement(rec, 'INAM')? xelib.GetHexFormID(xelib.GetLinksTo(rec, 'INAM')) : '';
	let templateNPC = xelib.HasElement(rec, 'TPLT')? xelib.GetHexFormID(xelib.GetLinksTo(rec, 'TPLT')) : '';
	let inventoryEntries = xelib.HasElement(rec, 'Items')?
		xelib.GetElements(rec, 'Items')
		.map(e => {
			let item = xelib.GetHexFormID(xelib.GetLinksTo(e, 'CNTO\\Item'));
			let count = xelib.GetIntValue(e, 'CNTO\\Count');
			return {item, count};
		}) : [];
	let obj = {formID, editorID, npcFlags, templateFlags, deathItem, templateNPC, inventoryEntries};
	return [formID, obj];
}));
fh.saveJsonFile('C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/NPCs.json', data);