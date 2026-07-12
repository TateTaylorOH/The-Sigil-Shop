let fs = require('fs');
let modName = 'The-Sigil-Shop';
let recordListFilename = 'RecList.csv';
let referenceListFilename = 'SoulCairnRefs.csv';
let swapFilename = 'SoulCairnUsesSigils_SWAP.ini';
let discardRecords = ['ACTI', 'ALCH', 'AMMO', 'ARMO', 'BOOK', 'DOOR', 'FURN', 'IDLM', 'INGR', 'LIGH', 'MSTT', 'SCRL', 'SLGM', 'SOUN', 'STAT', 'TXST', 'WEAP'];
let keepRecords = ['CONT', 'FLOR', 'LVLI', 'MISC', 'NPC_', 'TREE'];

let pathParts = __dirname.split('\\');
if(!pathParts.map(p => p.toLowerCase()).includes(modName.toLowerCase())){
	console.log(`Searched for mod root folder named "${modName}" in\n${__dirname}\nbut no folder with that name was found. Correct modName to continue.`);
	return;
}
let modPath = pathParts.slice(0, pathParts.findIndex(p => p.toLowerCase() === modName.toLowerCase()) + 1).join('/');
let zEditOutputPath = `${modPath}/Source/Utilities/zEdit`;

let recListPath = `${zEditOutputPath}/${recordListFilename}`;
if(!fs.existsSync(recListPath)){
	console.log(`${recordListFilename} not found at expected path\n${recListPath}\nCreate the file to continue.`);
	return;
}
let FormIDMap = Object.fromEntries(
	fs.readFileSync(recListPath, {encoding: 'utf8'})
	.split('\r\n')
	.map(e => {
		let [formID, signature, editorID] = e.split(',');
		let obj = {formID, signature, editorID};
		return [formID, obj];
	}));
console.log(`Successfully loaded ${Object.keys(FormIDMap).length} form ids.`);
let EditorIDMap = Object.fromEntries(
	Object.values(FormIDMap)
	.filter(rec => rec.editorID !== '')
	.map(rec => [rec.editorID, rec]));
console.log(`Mapped ${Object.keys(EditorIDMap).length} records by editor id.`);


let refListPath = `${zEditOutputPath}/${referenceListFilename}`;
if(!fs.existsSync(refListPath)){
	console.log(`${referenceListFilename} not found at expected path\n${refListPath}\nCreate the file to continue.`);
	return;
}
let SoulCairnReferenceMap = Object.fromEntries(
	fs.readFileSync(refListPath, {encoding: 'utf8'})
	.split('\r\n')
	.map(e => {
		let [formID, signature, baseID, difficulty] = e.split(',');
		let obj = {formID, signature, baseID, difficulty};
		return [formID, obj];
	}));
let refIDs = Object.keys(SoulCairnReferenceMap);
console.log(`Successfully loaded ${refIDs.length} references.`);

let swapPath = `${modPath}/${swapFilename}`;
let swapFound = fs.existsSync(swapPath);
if(!swapFound){
	console.log(`${swapFilename} not found at expected path\n${swapPath}\nSwaps will not be applied.`);
} else {
	//syntax. this is only the most basic case.
	//https://www.nexusmods.com/skyrimspecialedition/mods/60805
	let swaps = {};
	let file = fs.readFileSync(swapPath, {encoding: 'utf8'}).replace(/^\uFEFF/, '').trim();
	let lines = file.split('\r\n');
	for(let i = 0; i < lines.length; i++){
		let line = lines[i];
		if(line.startsWith('[') && line.endsWith(']')) continue; //section line, i don't care for this case
		let [oldId, newID] = line.split('|');
		let oldFormID = oldId in FormIDMap? oldId : (oldId in EditorIDMap? EditorIDMap[oldId].formID : undefined);
		let newFormID = newID in FormIDMap? newID : (newID in EditorIDMap? EditorIDMap[newID].formID : undefined);
		if(oldFormID !== undefined && newFormID !== undefined) swaps[oldFormID] = newFormID;
	}
	console.log(`Loaded ${Object.keys(swaps).length} base object swaps.`);
	let oldIDs = Object.keys(swaps);
	for(let i = 0; i < oldIDs.length; i++){
		let oldID = oldIDs[i], oldEditorID = FormIDMap[oldID].editorID, newID = swaps[oldID], newEditorID = FormIDMap[newID].editorID;
		console.log(`Applying ${oldEditorID !== ''? oldEditorID + ' (' + oldID + ')' : oldID} to ${newEditorID !== ''? newEditorID + ' (' + newID + ')' : newID} swap.`);
		let swapRefs = refIDs.filter(id => SoulCairnReferenceMap[id].baseID === oldID);
		swapRefs.forEach(id => SoulCairnReferenceMap[id].baseID = newID);
		console.log(`Replaced base object of ${swapRefs.length} references.`);
	}
}

refIDs = refIDs.filter(id => {
	let baseSig = FormIDMap[SoulCairnReferenceMap[id].baseID].signature;
	return !discardRecords.includes(baseSig);
});
console.log(`Filtered to ${refIDs.length} references.`);

let referenceTypes = [];
refIDs.forEach(id => {
	let ref = SoulCairnReferenceMap[id], baseID = ref.baseID, baseRec = FormIDMap[baseID], signature = baseRec.signature;
	if(!referenceTypes.includes(signature)) referenceTypes.push(signature);
});
referenceTypes.sort();
let unallowedTypes = referenceTypes.filter(s => !keepRecords.includes(s));
if(unallowedTypes.length > 0){
	console.log(`Some records with unchecked signatures are in the dataset. Label them as keep or discard to continue.\n${unallowedTypes.join(', ')}`);
	return;
}

//TODO: determine inventory of containers, flora, leveled items, npcs, and trees