let fs = require('fs');
let modName = 'The-Sigil-Shop';
let recordListFilename = 'RecList.csv';
let referenceListFilename = 'SoulCairnRefs.csv';
let swapFilename = 'SoulCairnUsesSigils_SWAP.ini';
let containerJSONFilename = 'Containers.json';
let leveledItemJSONFilename = 'LeveledItems.json';
let npcJSONFilename = 'NPCs.json';
let discardRecords = ['ACTI', 'DOOR', 'FURN', 'IDLM', 'LIGH', 'MSTT','SOUN', 'STAT', 'TXST'];
let keepRecords = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'CONT', 'FLOR', 'INGR', 'LVLI', 'MISC', 'NPC_',  'SCRL', 'SLGM', 'TREE', 'WEAP'];

let itemsOfInterest = ['01DE5031'];

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

refIDs.forEach(id => {
	let ref = SoulCairnReferenceMap[id];
	let base = FormIDMap[ref.baseID];
	ref.baseForm = base;
});

refIDs = refIDs.filter(id => {
	let baseSig = SoulCairnReferenceMap[id].baseForm.signature;
	return !discardRecords.includes(baseSig);
});
console.log(`Filtered to ${refIDs.length} references for deeper processing.`);

let referenceTypes = [];
refIDs.forEach(id => {
	let signature = SoulCairnReferenceMap[id].baseForm.signature;
	if(!referenceTypes.includes(signature)) referenceTypes.push(signature);
});
referenceTypes.sort();
let unallowedTypes = referenceTypes.filter(s => !keepRecords.includes(s));
if(unallowedTypes.length > 0){
	console.log(`Some records with unchecked signatures are in the dataset. Label them as keep or discard to continue.\n${unallowedTypes.join(', ')}`);
	return;
}

function loadFormJSON(filename){
	let JSONPath = `${zEditOutputPath}/${filename}`;
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
let leveledItemContents = loadFormJSON(leveledItemJSONFilename);
let npcContents = loadFormJSON(npcJSONFilename);

//check that contents are loaded;
let baseFormIDs = refIDs.map(id => SoulCairnReferenceMap[id].baseForm.formID).filter((value, index, array) => array.indexOf(value) === index).sort();
//these items cannot contain other items.
let skipSignatures = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'INGR', 'MISC', 'SCRL', 'SLGM', 'WEAP'];
let contents = {};
for(let i = 0; i < baseFormIDs.length; i++){
	let id = baseFormIDs[i];
	let baseForm = FormIDMap[id];
	let signature = baseForm.signature;
	if(skipSignatures.includes(signature)) continue;
	if(signature === 'CONT' && id in containerContents) continue;
	if(signature === 'LVLI' && id in leveledItemContents) continue;
	if(signature === 'NPC_' && id in npcContents) continue;
	console.log(`${id} not found in loaded contents. Load or remove to proceed.`);
	Object.entries(baseForm).forEach(e => console.log(`${e[0]}: ${e[1]}`));
	return;
}

//TODO: determine inventory of containers, flora, leveled items, npcs, and trees
/**
	CONT
	'DLC01SC_Chest (02015FDF)',
	'DLC01SC_Chest02 (0201611F)',
	'DLC01SC_ChestBoss (020040A5)',
	'DLC1TreasSoulCairnChest (02015461)',
	'TreasKnapsack (000B7879)',
	'DLC01SoulcairnHuskSack (0200689A)',
	'DLC01VQ05GemChest (0200EA8C)',
	'TreasDraugrChestBoss (00020671)',
	'DLC1TreasSoulCairnChest02 (0201692A)'
	FLOR
	FLOR - PFIG
	'DLC01SoulHusk02 (02012DBA)',
	'DLC01SoulHusk01 (02012DB9)',
	'SEHT_Sigil_CoinPurseLarge (07000813)',
	'SEHT_Sigil_CoinPurseMedium (07000812)',
	'SEHT_Sigil_CoinPurseSmall (07000811)'
	LVLI
	'LItemSoulGemRandom (000638B7)',
	'LootBanditSoulGems100 (000B4211)',
	'LItemPotionFortifyConjuration (00039ED1)',
	'LItemSoulGemFullNoBlack (0010DDB9)',
	'LItemPoisonAllBest (00074A37)',
	'LItemDragonPriestStaff100 (000EDDD4)',
	'LItemPotionAllBest (000E3E9A)',
	'LItemPotionRestoreHMSBest (00065A60)',
	'LItemEnchWeaponDagger (0008992F)',
	'LItemArmorShieldAnyBest (000571B1)',
	'LItemSoulGemEmptyNoBlack (0010DDBB)',
	'LItemEnchWeaponSwordShock (0010782F)',
	'LItemEnchSteelDagger (000A6A20)',
	'LItemHunterWeaponBow (0010D9D2)',
	'LItemEnchSteelWarAxe (0004B584)',
	'LItemVigilantBooks (0010BFF1)',
	'LItemEnchWeaponGreatsword (00089930)'
	NPC_
	'DLC01SoulCairnSoulHorseRider (02002B0D)',
	'DLC1LvlSoulCairnMistman (020071AF)',
	'DLC1LvlSoulCairnBonemanMeleeAmbush (020150AF)',
	'DLC1LvlSoulCairnBonemanMissileAmbush (0200BF5E)',
	'DLC1LvlSoulCairnWrathmanAmbush (02004575)',
	'DLC1LvlSoulCairnBonemanMissile (020071AA)',
	'DLC1Valerica (02003B8B)',
	'DLC1LvlSoulCairnMistmanAmbush (0200BF5C)',
	'DLC1SoulCairnWisp (0201A8EF)',
	'DLC1SoulCairnCrystalCaster (02008B34)',
	'DLC01SoulCairnSoulNecromancerFemale (020150B3)',
	'TreasCorpseSkeletonRigid (000B9FD8)',
	'DLC01SoulCairnSoulFarmFemale (02015DF4)',
	'DLC01SoulCairnSoulHunterM (0201A4FD)',
	'DLC01SoulCairnSoulMeleeFemale02 (0201A4FA)',
	'DLC01SoulCairnSoulHunterF (0201A4FC)',
	'DLC01SoulCairnSoulMageMale03 (0201A503)',
	'DLC01SoulCairnSoulMeleeMale02 (0201A4FE)',
	'DLC01SoulCairnKeeperShield (02007B0F)',
	'DLC01SoulCairnReaper (0201A73E)',
	'DLC01SoulCairnKeeperBowArrow (020074F9)',
	'DLC01SoulCairnKeeper2H (020074F8)',
	'DLC01SoulCairnSoulMorven (020071F1)',
	'DLC1Durnehviir (020030D8)',
	'DLC01SoulCairnHorseUnrideable (0200BDCF)',
	'DLC1VQ05BonemanSummon (0200BFF0)',
	'DLC1LvlSoulCairnWrathman (020071AD)',
	'DLC01SoulCairnKeeperSoul (0200EA8B)',
	'DLC1LvlSoulCairnBonemanMelee (020150AE)',
	'DLC01SoulCairnJiub (020093A1)',
	'DLC01SoulCairnSoulMissileFemale (020150B5)',
	'DLC01SoulCairnSoulNecromancerMale (020150B2)',
	'DLC01SoulCairnSoulOrcMale (020150B6)',
	'DLC01SoulCairnSoulMeleeFemale (020150B1)',
	'DLC01SoulCairnSoulCow (0201602C)',
	'DLC01SoulCairnSoulFarmMale (02015DF3)',
	'DLC01SoulCairnSoulMeleeMale (02004759)',
	'DLC01SoulCairnSoulMageMale (0201A4F7)'
	TREE - PFIG
	'TreeSoulCairnShrub02 (02003BDA)',
	'TreeSoulCairnTreeGroup (0200DDB5)',
	'TreeSoulCairnTree02 (02004333)',
	'TreeSoulCairnShrub01 (02003BD9)',
	'TreeSoulCairnTree03 (02004334)',
	'TreeSoulCairnShrub03 (02003BDB)',
	'TreeSoulCairnTree01 (02004332)',
	'TreeDeadVinePatch (0200431F)',
	'TreeDeadVineLongAsh (02004322)',
	'TreeDeadVineHallwayAsh (02004321)',
	'TreeDeadVinePatchAsh (02004320)',
	'TreeSoulCairnShrubGroup02 (02011D55)'
  **/