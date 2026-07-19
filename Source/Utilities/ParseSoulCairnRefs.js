let fs = require('fs');

let modName = 'The-Sigil-Shop';
let recordListFilename = 'RecList.csv';
let referenceListFilename = 'SoulCairnRefs.csv';
let swapFilename = 'SoulCairnUsesSigils_SWAP.ini';
let cdfFilename = 'SoulCairnUsesSigils.json';
let containerJSONFilename = 'Containers.json';
let floraJSONFilename = 'Flora.json';
let leveledItemJSONFilename = 'LeveledItems.json';
let leveledCharacterJSONFilename = 'LeveledCharacters.json';
let npcJSONFilename = 'NPCs.json';

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
	let cdfPath = `${modPath}/SKSE/Plugins/ContainerDistributionFramework/${cdfFilename}`;
	let contentsJSONPaths = [
		`${zEditOutputPath}/${containerJSONFilename}`, `${zEditOutputPath}/${floraJSONFilename}`, `${zEditOutputPath}/${leveledCharacterJSONFilename}`, `${zEditOutputPath}/${leveledItemJSONFilename}`, `${zEditOutputPath}/${npcJSONFilename}`
	];
	return {
		modPath,
		zEditOutputPath,
		recListPath,
		refListPath,
		swapPath,
		cdfPath,
		contentsJSONPaths,
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
const loadOrder = [
	'Skyrim.esm',
	'Update.esm',
	'Dawnguard.esm',
	'Hearthfires.esm',
	'Dragonborn.esm',
	'ccbgssse025-advdsgs.esm',
	'M.I.N.T.esp',
	'SoulCairnUsesSigils.esp'
];
//matches /(start of string)0x[1-6 hex digits]|(any valid filename characters).es[lmp](end of string)
const cdfFormstringRegex = /^0x([0-9a-f]{1,6})\|([^\<\>\:\"\/\\\|\?\*]+.es[lmp])$/i;
function parseFormID(FormIDMap, EditorIDMap, str){
	if(str in FormIDMap) return str;
	if(str in EditorIDMap) return EditorIDMap[str].formID;
	let cdfMatch = cdfFormstringRegex.exec(str);
	if(cdfMatch !== null){
		let formID = cdfMatch[1], filename = cdfMatch[2], lcFilename = filename.toLowerCase();
		let lo = loadOrder.map(f => f.toLowerCase());
		if(!lo.includes(lcFilename)) throw new Error(`Failed to match ${filename} to a file in load order.`);
		let fileIndex = lo.findIndex(f => f === lcFilename).toString(16);
		formID = `${'0'.repeat(2-fileIndex.length)}${fileIndex}${'0'.repeat(6-formID.length)}${formID}`.toUpperCase();
		if(formID in FormIDMap) return formID;
	}
}
function loadBaseObjectSwapper(path, FormIDMap, EditorIDMap){
	if(!fs.existsSync(path)){
		console.log(`${swapFilename} not found at expected path\n${path}\nSwaps will not be applied.`);
		return;
	}
	let file = fs.readFileSync(path, {encoding: 'utf8'}).replace(/^\uFEFF/, '');
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
function loadContainerDistributionFramework(path, FormIDMap, EditorIDMap){
	if(!fs.existsSync(path)){
		console.log(`${cdfFilename} not found at expected path\n${path}\nContainer distribution will not be applied.`);
		return;
	}
	let file = fs.readFileSync(path, {encoding: 'utf8'});
	let json = JSON.parse(file);
	//parsing
	//https://github.com/SeaSparrowOG/DynamicContainerInventoryFramework/wiki#configuration-rules
	let rules = [], JSONrules = json.rules ?? [];
	for(let i = 0; i < JSONrules.length; i++){
		let rule = JSONrules[i];
		let name = rule.friendlyName, jsonChanges = rule.changes, changes = [];
		for(let j = 0; j < jsonChanges.length; j++){
			let change = jsonChanges[j];
			let ruleType = null;
			let remove = parseFormID(FormIDMap, EditorIDMap, change.remove);
			let add = (change.add ?? []).map(str => parseFormID(FormIDMap, EditorIDMap, str));
			if('add' in change && 'remove' in change) {
				ruleType = 'Replace';
				if(remove === undefined) throw new Error(`Failed to parse FormID from ${change.remove} in rule ${name} in ${cdfFilename}.`);
				add.forEach((v, index) => {
					if(v === undefined) throw new Error(`Failed to parse FormID from ${change.add[index]} in rule ${name} in ${cdfFilename}.`);
				});
				changes.push({ruleType, remove, add});
				continue;
			}
			if('add' in change && 'removeByKeywords' in change) {
				ruleType = 'ReplaceByKeywords';
				throw new Error(`Case ${ruleType} not handled. No keyword processing at this time.`);
			}
			if('add' in change) {
				ruleType = 'Add';
				add.forEach((v, index) => {
					if(v === undefined) throw new Error(`Failed to parse FormID from ${change.add[index]} in rule ${name} in ${cdfFilename}.`);
				});
				let count = rule.count ?? 1;
				changes.push({ruleType, add, count});
				continue;
			}
			if('remove' in change) {
				ruleType = 'Remove';
				if(remove === undefined) throw new Error(`Failed to parse FormID from ${change.remove} in rule ${name} in ${cdfFilename}.`);
				let count = rule.count ?? Infinity;
				changes.push({ruleType, remove, count});
				continue;
			}
			if('removeByKeywords' in change) {
				ruleType = 'RemoveByKeywords';
				throw new Error(`Case ${ruleType} not handled. No keyword processing at this time.`);
			}
			throw new Error(`Failed to parse rule type from rule ${name} in ${cdfFilename}.`);
		}
		let conditions = rule.conditions;
		rules.push({name, changes, conditions});
	}
	console.log(`Loaded ${rules.length} Container Distribution Framework rule${rules.length > 1? 's': ''} from ${cdfFilename}.`);
	return rules;
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
const noInventoryRecs = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'INGR', 'MISC', 'SCRL', 'SLGM', 'WEAP'];
function loadFormContentJSONS(jsonPaths, refs, FormIDMap){
	let contents = {};
	for(let i = 0; i < jsonPaths.length; i++){
		let path = jsonPaths[i];
		if(fs.existsSync(path)){
			let file = fs.readFileSync(path, {encoding: 'utf8'});
			try {
				let data = JSON.parse(file);
				Object.assign(contents, data);
			}
			catch (e){
				console.log(`Failed to parse ${JSONPath}.`);
			}
		}
	}
	let baseFormIDs = refs.map(ref => ref.baseForm).filter(rec => !noInventoryRecs.includes(rec.signature))
		.map(rec => rec.formID).filter((value, index, array) => array.indexOf(value) === index).sort();
	let missingIDs = baseFormIDs.filter(id => !(id in contents));
	if(missingIDs.length > 0){
		console.log(`Failed to find contents of ${missingIDs.length} objects.`);
		let sigs = missingIDs.map(id => FormIDMap[id].signature)
			.filter((value, index, array) => array.indexOf(value) === index).sort();
		sigs.forEach(sig => {
			let recs = missingIDs.filter(id => FormIDMap[id].signature === sig).map(id => {
				let rec = FormIDMap[id];
				if(rec.editorID !== null) return `${rec.editorID} (${rec.formID})`;
				return rec.formID;
			});
			console.log(`${sig} (${recs.length} records):`);
			console.log(recs.join(', '));
		});
		throw new Error(`Failed to find contents of ${missingIDs.length} objects. Load or exclude to continue.`);
	}
	console.log(`Loaded contents of all items.`);
	return contents;
}

let paths = getPaths();
let {FormIDMap, EditorIDMap} = loadRecordList(paths.recListPath);
let {ReferenceIDs, ReferenceDataMap}  = loadReferenceList(paths.refListPath);
let bosRules = loadBaseObjectSwapper(paths.swapPath, FormIDMap, EditorIDMap);
if(bosRules !== undefined) applyBaseObjectSwap(ReferenceIDs, ReferenceDataMap, FormIDMap, bosRules, (id) => FormIDMap[id].editorID === 'DLC1SoulCairnLocation');
applyBaseDataToRefs(FormIDMap, ReferenceDataMap);//simplify ref data lookups now that bos swaps are applied
let InvRefIDs = filterItemNPCRecs(ReferenceIDs, ReferenceDataMap);
let formContents = loadFormContentJSONS(paths.contentsJSONPaths, InvRefIDs.map(id => ReferenceDataMap[id]), FormIDMap);

let cdfRules = loadContainerDistributionFramework(paths.cdfPath, FormIDMap, EditorIDMap);

//determine what forms must be resolved to resolve each item
let inventoryDependencies = {};
function getDependencies(id, signature){
	if(noInventoryRecs.includes(signature)) return null;
	let dependencies = [];
	if(signature === 'CONT'){
		let entries = formContents[id].entries;
		dependencies = entries.map(e => e.item);
	} else if(signature === 'FLOR' || signature === 'TREE') {
		let plantItem = formContents[id];
		if(plantItem === '') return null;
		return plantItem;
	} else if(signature === 'LVLI' || signature === 'LVLN'){
		let entries = formContents[id].entries;
		dependencies = entries.map(e => e.item);
	} else if(signature === 'NPC_'){
		let npc = formContents[id];
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
let requiredDependencies = InvRefIDs.map(id => ReferenceDataMap[id].baseForm.formID);
let missingDependencies = requiredDependencies;
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
	if(noInventoryRecs.includes(signature)) return itemsOfInterest.includes(id);
	if(signature === "CONT"){
		let items = formContents[id].entries.map(e => e.item);
		return items.some(e => itemCanContainIOI[e.item]);
	}
	if(signature === "FLOR" || signature === "TREE"){
		let plantItem = formContents[id];
		if(plantItem === '') return false;
		return itemCanContainIOI[plantItem];
	}
	if(signature === "LVLI" || signature === "LVLN"){
		let items = formContents[id].entries.map(e => e.item);
		return items.some(e => itemCanContainIOI[e.item]);
	}
	if(signature === "NPC_"){
		let npc = formContents[id];
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
