let recs = xelib.GetRecords(0, "LVLI")
	.map(rec => xelib.GetWinningOverride(rec))
	.sort((a, b) => xelib.GetFormID(a) - xelib.GetFormID(b));
let data = Object.fromEntries(recs.map(rec => {
	let formID = xelib.GetHexFormID(rec);
	let editorID = xelib.EditorID(rec);
	let chanceNoneInt = xelib.GetIntValue(rec, 'LVLD');
	let chanceNoneGlob = xelib.HasElement(rec, 'LVLG')? xelib.GetHexFormID(xelib.GetLinksTo(rec, 'LVLG')) : "";
	let lvliFlags = xelib.GetEnabledFlags(rec, 'LVLF').filter(e => e !== '');
	let flags = {
		AllLevelsLTOE: lvliFlags.includes("Calculate from all levels <= player's level"),
		ForEachItem: lvliFlags.includes("Calculate for each item in count"),
		UseAll: lvliFlags.includes("Use All"),
		SpecialLoot: lvliFlags.includes("Special Loot")
	};
	let obj = {formID, editorID, chanceNoneInt, chanceNoneGlob, flags};
	return [formID, obj];
}));
fh.saveJsonFile('C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/LeveledItems.json', data);