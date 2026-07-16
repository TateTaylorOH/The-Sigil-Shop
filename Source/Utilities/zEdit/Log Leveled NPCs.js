let recs = xelib.GetRecords(0, "LVLN")
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
		ForEachItem: lvliFlags.includes("Calculate for each item in count")
	};
	let entries = xelib.HasElement(rec, 'Leveled List Entries')?
		xelib.GetElements(rec, 'Leveled List Entries')
		.map(e => {
			let level = xelib.GetIntValue(e, 'LVLO\\Level');
			let item = xelib.GetHexFormID(xelib.GetLinksTo(e, 'LVLO\\Reference'));
			let count = xelib.GetIntValue(e, 'LVLO\\Count');
			return {level, item, count};
		}) : [];
	let obj = {formID, editorID, chanceNoneInt, chanceNoneGlob, flags, entries};
	return [formID, obj];
}));
fh.saveJsonFile('C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/LeveledCharacters.json', data);