let recs = xelib.GetRecords(0, "CONT")
	.map(rec => xelib.GetWinningOverride(rec))
	.sort((a, b) => xelib.GetFormID(a) - xelib.GetFormID(b));
let data = Object.fromEntries(recs.map(rec => {
	let formID = xelib.GetHexFormID(rec);
	let editorID = xelib.EditorID(rec);
	let entries = xelib.HasElement(rec, 'Items')?
		xelib.GetElements(rec, 'Items')
		.map(e => {
			let item = xelib.GetHexFormID(xelib.GetLinksTo(e, 'CNTO\\Item'));
			let count = xelib.GetIntValue(e, 'CNTO\\Count');
			return {item, count};
		}) : [];
	return [formID, {formID, editorID, entries}];
}));
fh.saveJsonFile('C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/Containers.json', data);