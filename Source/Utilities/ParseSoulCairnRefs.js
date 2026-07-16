let fs = require('fs');

let modName = 'The-Sigil-Shop';
let recordListFilename = 'RecList.csv';
let referenceListFilename = 'SoulCairnRefs.csv';
let swapFilename = 'SoulCairnUsesSigils_SWAP.ini';
let containerJSONFilename = 'Containers.json';
let floraJSONFilename = 'Flora.json';
let leveledItemJSONFilename = 'LeveledItems.json';
let leveledCharacterJSONFilename = 'LeveledCharacters.json';
let npcJSONFilename = 'NPCs.json';
let discardRecords = ['ACTI', 'DOOR', 'FURN', 'IDLM', 'LIGH', 'MSTT','SOUN', 'STAT', 'TXST'];
let keepRecords = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'CONT', 'FLOR', 'INGR', 'LVLI', 'MISC', 'NPC_',  'SCRL', 'SLGM', 'TREE', 'WEAP'];

let itemsOfInterest = ['01DE5031'];

function getPaths(){
	let pathParts = __dirname.split('\\'), lowerParts = pathParts.map(s => s.toLowerCase()), lowerName = modName.toLowerCase();
	let modPartIndex = lowerParts.findIndex(s => s === lowerName);
	if(modPartIndex < 0) throw new Error(`Searched for mod root folder named "${modName}" in\n${__dirname}\nbut no folder with that name was found. Correct modName to continue.`);
	let modPath = pathParts.slice(0, modPartIndex + 1).join('/');
	let zEditOutputPath = `${modPath}/Source/Utilities/zEdit`;
	let recListPath = `${zEditOutputPath}/${recordListFilename}`;
	let refListPath = `${zEditOutputPath}/${referenceListFilename}`;
	let swapPath = `${modPath}/${swapFilename}`;
	return {
		modPath,
		zEditOutputPath,
		recListPath,
		refListPath,
		swapPath
	};
}
function parseCSV(csvString, columnKeys, defaultValues=undefined, delimiter=','){
	let lines = csvString.split('\r\n');
	if(columnKeys === undefined){
		let maxValues = 0;
		for(let i = 0; i < lines.length; i++){
			let line = lines[i], count = line.length > 0? 1 : 0;
			for(let j = 0; j < line.length; j++){
				if(line.charAt(j) === delimiter) count++;
			}
			if(count > maxValues) maxValues = count;
		}
		columnKeys = new Array(maxValues).fill(0).map((e, i) => 'field'+i);
	}
	let numFields = columnKeys.length;
	if(defaultValues === undefined) defaultValues = columnKeys.map(k => null);
	while(defaultValues.length < numFields) defaultValues.push(null);
	let defaultObject = Object.fromEntries(columnKeys.map((e, i) => [e, defaultValues[i]]));
	let objects = new Array(lines.length);
	for(let i = 0; i < lines.length; i++){
		let line = lines[i];
		let values = line.split(delimiter);
		let n = Math.min(numFields, values.length);
		let obj = Object.assign({}, defaultObject);
		for(let j = 0; j < n; j++){
			let k = columnKeys[j];
			let v = values[j];
			if(v !== '') obj[k] = v;
		}
		objects[i] = obj;
	}
	return objects;
}
/**
All data exported with load order:
00 Skyrim.esm
01 Update.esm
02 Dawnguard.esm
03 Hearthfires.esm
04 Dragonborn.esm
05 ccbgssse025-advdsgs.esm
06 M.I.N.T.esp
07 SoulCairnUsesSigils.esp
*/
function loadRecordList(path){
	if(!fs.existsSync(path)) throw new Error(`${recordListFilename} not found at expected path\n${path}\nCreate the file to continue.`);
	let csvText = fs.readFileSync(path, {encoding: 'utf8'});
	let recordList = parseCSV(csvText, ['formID', 'signature', 'editorID'])
		.filter(rec => rec.formID !== null && rec.signature !== null);
	let FormIDMap = Object.fromEntries(recordList.map(rec => [rec.formID, rec]));
	let values = Object.values(FormIDMap);
	console.log(`Loaded ${values.length} records by form id.`);
	values = values.filter(rec => rec.editorID !== null);
	let EditorIDMap = Object.fromEntries(values.map(rec => [rec.editorID, rec]));
	console.log(`Mapped ${Object.keys(EditorIDMap).length} records by editor id.`);
	return {FormIDMap, EditorIDMap};
}
function loadReferenceList(path){
	if(!fs.existsSync(path)) throw new Error(`${referenceListFilename} not found at expected path\n${path}\nCreate the file to continue.`);
	let csvText = fs.readFileSync(path, {encoding: 'utf8'});
	let refList = parseCSV(csvText, ['formID', 'signature', 'baseID', 'difficulty'], [null, null, null, 'None'])
		.filter(rec => rec.formID !== null && rec.signature !== null);
	let ReferenceDataMap = Object.fromEntries(refList.map(ref => [ref.formID, ref]));
	let ReferenceIDs = Object.keys(ReferenceDataMap);
	console.log(`Loaded data for ${ReferenceIDs.length} references.`);
	return {ReferenceIDs, ReferenceDataMap};
}

let paths = getPaths();
let {FormIDMap, EditorIDMap} = loadRecordList(paths.recListPath);
let {ReferenceIDs, ReferenceDataMap}  = loadReferenceList(paths.refListPath);

let swapFound = fs.existsSync(paths.swapPath);
if(!swapFound){
	console.log(`${swapFilename} not found at expected path\n${paths.swapPath}\nSwaps will not be applied.`);
} else {
	//syntax. this is only the most basic case.
	//https://www.nexusmods.com/skyrimspecialedition/mods/60805
	let swaps = {};
	let file = fs.readFileSync(paths.swapPath, {encoding: 'utf8'}).replace(/^\uFEFF/, '').trim();
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
		let swapRefs = ReferenceIDs.filter(id => ReferenceDataMap[id].baseID === oldID);
		swapRefs.forEach(id => ReferenceDataMap[id].baseID = newID);
		console.log(`Replaced base object of ${swapRefs.length} references.`);
	}
}

ReferenceIDs.forEach(id => {
	let ref = ReferenceDataMap[id];
	let base = FormIDMap[ref.baseID];
	ref.baseForm = base;
});

ReferenceIDs = ReferenceIDs.filter(id => {
	let baseSig = ReferenceDataMap[id].baseForm.signature;
	return !discardRecords.includes(baseSig);
});
console.log(`Filtered to ${ReferenceIDs.length} references for deeper processing.`);

let referenceTypes = [];
ReferenceIDs.forEach(id => {
	let signature = ReferenceDataMap[id].baseForm.signature;
	if(!referenceTypes.includes(signature)) referenceTypes.push(signature);
});
referenceTypes.sort();
let unallowedTypes = referenceTypes.filter(s => !keepRecords.includes(s));
if(unallowedTypes.length > 0){
	console.log(`Some records with unchecked signatures are in the dataset. Label them as keep or discard to continue.\n${unallowedTypes.join(', ')}`);
	return;
}

function loadFormJSON(filename){
	let JSONPath = `${paths.zEditOutputPath}/${filename}`;
	let output = {};
	if(fs.existsSync(JSONPath)) {
		let file = fs.readFileSync(JSONPath, {encoding: 'utf8'});
		try {
			let data = JSON.parse(file);
			output = data;
			return output;
		}
		catch (e){
			console.log(`Failed to parse ${JSONPath}.`);
		}
	}
	return output;
}
let containerContents = loadFormJSON(containerJSONFilename);
let floraContents = loadFormJSON(floraJSONFilename);
let leveledNPCContents = loadFormJSON(leveledCharacterJSONFilename);
let leveledItemContents = loadFormJSON(leveledItemJSONFilename);
let npcContents = loadFormJSON(npcJSONFilename);

//check that contents are loaded;
let baseFormIDs = ReferenceIDs.map(id => ReferenceDataMap[id].baseForm.formID).filter((value, index, array) => array.indexOf(value) === index).sort();
//these items cannot contain other items.
let skipSignatures = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'INGR', 'MISC', 'SCRL', 'SLGM', 'WEAP'];
let contents = {};
for(let i = 0; i < baseFormIDs.length; i++){
	let id = baseFormIDs[i];
	let baseForm = FormIDMap[id];
	let signature = baseForm.signature;
	if(skipSignatures.includes(signature)) continue;
	if(signature === 'CONT' && id in containerContents) continue;
	if(signature === 'FLOR' && id in floraContents) continue;
	if(signature === 'LVLI' && id in leveledItemContents) continue;
	if(signature === 'NPC_' && id in npcContents) continue;
	if(signature === 'TREE' && id in floraContents) continue;
	console.log(`${id} not found in loaded contents. Load or remove to proceed.`);
	Object.entries(baseForm).forEach(e => console.log(`${e[0]}: ${e[1]}`));
	return;
}
console.log(`Loaded contents of all items.`);
let baseContentsMap = Object.fromEntries(baseFormIDs
	.filter(id => !skipSignatures.includes(FormIDMap[id].signature))
	.map(id => [id, containerContents[id], floraContents[id], leveledNPCContents[id], leveledItemContents[id], npcContents[id]])
	.map(entries => entries.filter(v => v !== undefined)));

//determine what forms must be resolved to resolve each item
let inventoryDependencies = {};
function getDependencies(id, signature){
	if(skipSignatures.includes(signature)) return null;
	let dependencies = [];
	if(signature === 'CONT'){
		let entries = baseContentsMap[id].entries;
		dependencies = entries.map(e => e.item);
	} else if(signature === 'FLOR' || signature === 'TREE') {
		let plantItem = baseContentsMap[id];
		if(plantItem === '') return null;
		return plantItem;
	} else if(signature === 'LVLI' || signature === 'LVLN'){
		let entries = baseContentsMap[id].entries;
		dependencies = entries.map(e => e.item);
	} else if(signature === 'NPC_'){
		let npc = baseContentsMap[id];
		if(npc.templateNPC !== '' && npc.templateFlags.UseInventory){
			let template = npc.templateNPC;
			if(npc.templateNPC !== '') return template;
			throw new Error(`Invalid inventory flag state on templated NPC ${id} (no template assigned).`);
		}
		dependencies = npc.inventoryEntries.map(e => e.item);
	} else {
		return undefined;
	}
	if(dependencies.length === 0) return null;
	return dependencies;
}
let requiredDependencies = baseFormIDs;
let missingDependencies = baseFormIDs;
let pass = 0;
while(missingDependencies.length > 0){
	pass++;
	for(let i = 0; i < missingDependencies.length; i++){
		let id = missingDependencies[i];
		let signature = FormIDMap[id].signature;
		let dependencies = getDependencies(id, signature);
		if(dependencies !== undefined){
			inventoryDependencies[id] = dependencies;
			continue;
		}
		console.log(`Contents of ${id} not handled. Calc order not determined.`);
		Object.entries(FormIDMap[id]).forEach(e => console.log(`${e[0]}: ${e[1]}`));
		return;
	}
	requiredDependencies = Object.values(inventoryDependencies)
		.filter(v => v !== null).flat()
		.filter((value, index, array) => array.indexOf(value) === index).sort();
	missingDependencies = requiredDependencies.filter(id => inventoryDependencies[id] === undefined);
	console.log(`Pass ${pass}: Identified ${requiredDependencies.length} dependencies. ${missingDependencies.length} remain.`);
	missingDependencies.filter(id => !skipSignatures.includes(FormIDMap[id].signature))
		.map(id => [id, containerContents[id], floraContents[id], leveledNPCContents[id], leveledItemContents[id], npcContents[id]])
		.map(entries => entries.filter(v => v !== undefined))
		.forEach(e => baseContentsMap[e[0]] = e[1]);
}

function resolveCalcOrder(ids){
	let calcOrder = [];
	let dependencyList = Object.assign({}, inventoryDependencies);
	let pass = 0;
	while(ids.length > 0){
		pass++;
		let nullIDs = ids.filter(id => dependencyList[id] === null);
		calcOrder = calcOrder.concat(nullIDs);
		nullIDs.forEach(k => delete dependencyList[k]);
		ids = Object.keys(dependencyList);
		ids.forEach(id => {
			let dependencies = dependencyList[id];
			if(typeof dependencies === 'string'){
				if(calcOrder.includes(dependencies)) dependencyList[id] = null;
			}
			if(typeof dependencies === 'object' && Array.isArray(dependencies)){
				let remDeps = dependencies.filter(did => !calcOrder.includes(did));
				if(remDeps.length === 0) {
					dependencyList[id] = null;
					return;
				}
				dependencyList[id] = remDeps;
			}
		});
		if(nullIDs.length === 0) throw new Error(`Could not sort these ids: ${ids.join(', ')}`);
		console.log(`Pass ${pass}: Sorted ${nullIDs.length} ids. ${ids.length} remain.`);
	}
	return calcOrder;
}
let calcOrder = resolveCalcOrder(Object.keys(inventoryDependencies));

let itemCanContainIOI = {};
function getCanContainIOI(id, signature){
	if(skipSignatures.includes(signature)) return itemsOfInterest.includes(id);
	if(signature === "CONT"){
		let items = baseContentsMap[id].entries.map(e => e.item);
		return items.some(e => itemCanContainIOI[e.item]);
	}
	if(signature === "FLOR" || signature === "TREE"){
		let plantItem = baseContentsMap[id];
		if(plantItem === '') return false;
		return itemCanContainIOI[plantItem];
	}
	if(signature === "LVLI" || signature === "LVLN"){
		let items = baseContentsMap[id].entries.map(e => e.item);
		return items.some(e => itemCanContainIOI[e.item]);
	}
	if(signature === "NPC_"){
		let npc = baseContentsMap[id];
		let npcFlags = npc.npcFlags;
		let templateFlags = npc.templateFlags;
		//player cannot loot this actor
		if(npcFlags.Essential || npcFlags.IsGhost || npcFlags.Invulnerable) return false;
		let inventory = npc.inventoryEntries;
		if(npc.templateNPC !== '' && npc.templateFlags.UseInventory) {
			let templateNPC = npc.templateNPC;
			return itemCanContainIOI[templateNPC];
		}
		return inventory.some(e => itemCanContainIOI[e.item]);
	}
}
for(let i = 0; i < calcOrder.length; i++){
	let id = calcOrder[i];
	let baseForm = FormIDMap[id];
	let canContainIOI = getCanContainIOI(id, baseForm.signature);
	if(canContainIOI !== undefined){
		itemCanContainIOI[id] = canContainIOI;
		continue;
	}
	console.log(`(${i+1}/${calcOrder.length}) Could not determine if ${id} can contain items of interest.`);
	Object.entries(baseForm).forEach(e => console.log(`${e[0]}: ${e[1]}`));
	return;
}
//filter by items that can contain our items of interest IOI
//load CDF config
//update relevant containers
//filter baseids to only items that can contain IOI
//log those, then forecast
