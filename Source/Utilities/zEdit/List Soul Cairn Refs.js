let file = xelib.FileByName("SoulCairnContents.esp");
//WRLD, CELL, REFR, ACHR, LAND, NAVM
let recs = xelib.GetRecords(file, "ACHR,REFR", true);
//REFR fields
//Cell, Record Header, NAME, XTEL, XNPD, DATA, VMAD, XPRM, XSCL, Linked References, EDID, XLOC, XTRI, XRGD, XALP, XRDS, XLIG, Patrol, XLIB, Activate Parents, XEMI, XATR, XESP, XCNT, Ownership
//ACHR fields
//Cell, Record Header, NAME, XLCM, Linked References, DATA, EDID, VMAD, Activate Parents, XLCN, XRGD, XSCL, XLRT, XESP
let data = recs.map(rec => {
	let formID = xelib.GetHexFormID(rec);
	let sig = xelib.Signature(rec);
	let base = xelib.GetHexFormID(xelib.GetLinksTo(rec, "NAME"));
	if(xelib.HasElement(rec, "XLIB")) base = xelib.GetHexFormID(xelib.GetLinksTo(rec, "XLIB"));
	let diff = xelib.HasElement(rec, "XLCM")? xelib.GetValue(rec, "XLCM") : "";
	return [formID, sig, base, diff].join(',');
}).join('\r\n');
let path = 'C:/Games/Tools/MO2/profiles/Skyrim Special Edition/mods/The-Sigil-Shop/Source/Utilities/zEdit/SoulCairnRefs.csv';
fh.saveTextFile(path, data);