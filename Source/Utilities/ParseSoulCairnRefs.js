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
function parseFormID(FormIDMap, EditorIDMap, str){
	if(str in FormIDMap) return str;
	if(str in EditorIDMap) return EditorIDMap[str].formID;
}
function loadBaseObjectSwapper(path, FormIDMap, EditorIDMap){
	if(!fs.existsSync(path)){
		console.log(`${swapFilename} not found at expected path\n${path}\nSwaps will not be applied.`);
		return;
	}
	let file = fs.readFileSync(paths.swapPath, {encoding: 'utf8'}).replace(/^\uFEFF/, '');
	//read file into sections and values
	let lines = file.split('\r\n').filter(s => s !== '');
	let sections = [];
	let currentSection = [];
	for(let i = 0; i < lines.length; i++){
		let line = lines[i];
		if(line.startsWith('[') && line.endsWith(']') && currentSection.length > 0){
			sections.push(currentSection);
			currentSection = [];
		}
		currentSection.push(line);
	}
	if(currentSection.length > 0) sections.push(currentSection);
	//parsing sections into BOS rules
	//https://www.nexusmods.com/skyrimspecialedition/mods/60805
	//many cases are not handled because po3's documentation is so dogshit, and frankly this mod does a lot of shit it shouldn't
	//refer to the page for syntax is something should parse and doesn't
	let rules = [];
	for(let i = 0; i < sections.length; i++){
		let section = sections[i];
		let sectionHeader = section[0];
		let ruleType = null;
		if(sectionHeader === '[Forms]') ruleType = 'ByBaseObject';
		if(sectionHeader === '[References]') ruleType = 'BySpecificReference';
		if(sectionHeader.startsWith('[Forms|') && sectionHeader.endsWith(']')) ruleType = 'ByFilter';
		let filter = null;
		if(ruleType === 'ByFilter'){
			filter = sectionHeader.slice(sectionHeader.indexOf('|')+1,-1).split(',')
				.map(id => {
					let parsed = parseFormID(FormIDMap, EditorIDMap, id);
					if(parsed === undefined) throw new Error(`Failed to parse a form from ${id} in line ${sectionHeader} from ${swapFilename}.`);
					return parsed;
				});
		}
		if(ruleType === null || (ruleType === 'ByFilter' && filter === null)) throw new Error(`Failed to parse a rule type in line ${sectionHeader} from ${swapFilename}`);
		let swaps = [];
		for(let j = 1; j < section.length; j++){
			let line = section[j];
			let fields = line.split('|');
			if(fields.length < 2) throw new Error(`Failed to parse a rule in line ${sectionHeader} from ${swapFilename}`);
			let [originalIDs, newIDs] = fields;
			originalIDs = originalIDs.split(',').map(id => {
				let parsed = parseFormID(FormIDMap, EditorIDMap, id);
				if(parsed === undefined) throw new Error(`Failed to parse a form from ${id} in line ${line} from ${swapFilename}.`);
				return parsed;
			});
			newIDs = newIDs.split(',').map(id => {
				let parsed = parseFormID(FormIDMap, EditorIDMap, id);
				if(parsed === undefined) throw new Error(`Failed to parse a form from ${id} in line ${line} from ${swapFilename}.`);
				return parsed;
			});
			if(newIDs.length > 1) throw new Error(`Unhandled case: Multiple new IDs in line ${line} from ${swapFilename}.`);
			swaps.push({originalIDs, newIDs});
		}
		rules.push({ruleType, filter, swaps});
	}
	console.log(`Loaded ${rules.length} Base Object Swapper rule${rules.length > 1? 's': ''} from ${swapFilename}.`);
	return rules;
}
function applyBaseObjectSwap(RefIDs, ReferenceDataMap, FormIDMap, BOSRules, ByFilterFunction){
	if(ByFilterFunction === undefined) ByFilterFunction = (id) => false;
	let rules = BOSRules.filter(rule => {
		if(rule.ruleType === 'ByBaseObject' || rule.ruleType === 'BySpecificReference') return true;
		if(rule.ruleType === 'ByFilter') return rule.filter.some(ByFilterFunction);
		throw new Error(`Failed to parse BOS rule ${rule.ruleType} (filter: ${rule.filter})`);
	});
	const getDisplayIDs = (ids) => {
		let displayIDs = ids.map((id => FormIDMap[id].editorID ?? id));
		if(displayIDs.length === 1) return displayIDs[0];
		return `[${displayIDs.join(', ')}]`;
	};
	const applySwap = (refID, newIDs) => {
		let ref = ReferenceDataMap[refID];
		//this is the line you'd need to change for the multi ID case
		//probably easiest to replace with a fake form id, `BOS${ruleNum}`, and log a fake form with which IDs can replace it/chances for forecasting purposes later
		//but we're ignoring that case for now because it's real bad
		//why is po3 like this
		ref.baseID = newIDs[0];
	};
	let n = rules.length;
	if(n === 0){
		console.log(`No BOS rules apply to this case.`);
		return;
	}
	console.log(`${n === BOSRules.length? 'All loaded' : (n + '/' + BOSRules.length)} BOS rules apply to this case.`);
	for(let i = 0; i < rules.length; i++){
		let rule = rules[i], ruleType = rule.ruleType, swaps = rule.swaps;
		if(ruleType === 'ByBaseObject' || ruleType === 'ByFilter'){
			for(let j = 0; j < swaps.length; j++){
				let originalIDs = swaps[j].originalIDs, newIDs = swaps[j].newIDs;
				if(newIDs.length > 1) throw new Error(`Unhandled case: Multiple new IDs in line ${line} from ${swapFilename}.`);
				let originalDispIDs = getDisplayIDs(originalIDs), newDispIDs = getDisplayIDs(newIDs);
				let ruleNum = `${i + 1}${swaps.length === 1? '' : String.fromCodePoint(65+j)}`;
				let ruleName = ruleType === 'ByBaseObject'? 'Swap by Base Object': `Swap by Location (${getDisplayIDs(rule.filter)})`;
				let swapRefs = RefIDs.filter(id => originalIDs.includes(ReferenceDataMap[id].baseID));
				swapRefs.forEach(id => applySwap(id, newIDs));
				console.log(`Applied BOS rule ${ruleNum}. ${ruleName}: ${originalDispIDs} -> ${newDispIDs}. Replaced base object of ${swapRefs.length} references.`);
			}
		}
		if(ruleType === 'BySpecificReference'){
			for(let j = 0; j < swaps.length; j++){
				let originalIDs = swaps[j].originalIDs, newIDs = swaps[j].newIDs;
				if(newIDs.length > 1) throw new Error(`Unhandled case: Multiple new IDs in line ${line} from ${swapFilename}.`);
				let originalDispIDs = getDisplayIDs(originalIDs), newDispIDs = getDisplayIDs(newIDs);
				let ruleNum = `${i + 1}${swaps.length === 1? '' : String.fromCodePoint(65+j)}`;
				let ruleName = `Swap Specific Refs`;
				let swapRefs = originalIDs.filter(id => RefIDs.includes(id));
				swapRefs.forEach(id => applySwap(id, newIDs));
				console.log(`Applied BOS rule ${ruleNum}. ${ruleName}: ${originalDispIDs} -> ${newDispIDs}. Replaced base object of ${swapRefs.length} references.`);
			}
		}
	}
}
function applyBaseDataToRefs(FormIDMap, ReferenceDataMap){
	Object.values(ReferenceDataMap).forEach(ref => ref.baseForm = FormIDMap[ref.baseID]);
}
const worldOnlyRecs = ['ACTI', 'DOOR', 'FURN', 'IDLM', 'LIGH', 'MSTT','SOUN', 'STAT', 'TXST'];
const itemAndNPCRecs = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'CONT', 'FLOR', 'INGR', 'LVLI', 'MISC', 'NPC_',  'SCRL', 'SLGM', 'TREE', 'WEAP'];
function filterItemNPCRecs(ReferenceIDs, ReferenceDataMap){
	let filteredIDs = ReferenceIDs.filter(id => !worldOnlyRecs.includes(ReferenceDataMap[id].baseForm.signature));
	let baseSigs = filteredIDs.map(id => ReferenceDataMap[id].baseForm.signature)
		.filter((value, index, array) => array.indexOf(value) === index).sort();
	let unhandledSigs = baseSigs.filter(sig => !itemAndNPCRecs.includes(sig));
	if(unhandledSigs.length > 0) throw new Error(`Some records with unchecked signatures are in the dataset. Label them as "world only" or "item and NPC" to continue.\n${unhandledSigs.join(', ')}`);
	console.log(`Filtered to ${filteredIDs.length} references for deeper processing.`);
	return filteredIDs;
}

let paths = getPaths();
let {FormIDMap, EditorIDMap} = loadRecordList(paths.recListPath);
let {ReferenceIDs, ReferenceDataMap}  = loadReferenceList(paths.refListPath);
let bosRules = loadBaseObjectSwapper(paths.swapPath, FormIDMap, EditorIDMap);
if(bosRules !== undefined) applyBaseObjectSwap(ReferenceIDs, ReferenceDataMap, FormIDMap, bosRules, (id) => FormIDMap[id].editorID === 'DLC1SoulCairnLocation');
applyBaseDataToRefs(FormIDMap, ReferenceDataMap);//simplify ref data lookups now that bos swaps are applied
let InvRefIDs = filterItemNPCRecs(ReferenceIDs, ReferenceDataMap);

return;

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
