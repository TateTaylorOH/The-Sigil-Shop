let recs = xelib.GetRecords(0, "FLOR,TREE")
	.map(rec => xelib.GetWinningOverride(rec))
	.sort((a, b) => xelib.GetFormID(a) - xelib.GetFormID(b));
let data = Object.fromEntries(recs.map(rec => {
	let formID = xelib.GetHexFormID(rec);
	let plantItem = xelib.HasElement(rec, 'PFIG')? xelib.GetHexFormID(xelib.GetLinksTo(rec, 'PFIG')): '';
	return [formID, plantItem];
}));
fh.saveJsonFile('C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/Flora.json', data);