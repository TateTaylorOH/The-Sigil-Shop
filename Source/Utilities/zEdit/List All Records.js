let recs = xelib.GetRecords(0, "")
	.map(rec => xelib.GetWinningOverride(rec))
	.sort((a, b) => xelib.GetFormID(a) - xelib.GetFormID(b))
let data = recs.map(rec => {
    	let formID = xelib.GetHexFormID(rec);
		let sig = xelib.Signature(rec);
		let edid = xelib.HasElement(rec, "EDID")? xelib.EditorID(rec) : "";
		return [formID, sig, edid].join(',');
    }).join('\r\n');
let path = 'C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/RecList.csv';
fh.saveTextFile(path, data);