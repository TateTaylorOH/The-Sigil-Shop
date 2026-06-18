Scriptname SEHT_Debug extends Quest

bool debugMode = true

Event OnInit()
	RegisterForSingleUpdate(2.0)
endEvent

Event OnUpdate()
	RegisterForKey(47)
	DebugLog("Registered for V key.")
endEvent

function DebugLog(string s, bool mbox = false)
	if(debugMode)
		s = "SEHT: " + s
		if(mbox)
			debug.messagebox(s)
		else
			debug.Notification("SEHT: " + s)
		endIf
	endIf
endFunction

string function GetFormIDString(Form f)
	if(!f)
		return "(null)"
	endIf
	int formID = f.GetFormID()
	int highByte = Math.RightShift(Math.LogicalAnd(0xFF000000, formID), 24)
	string filename = ""
	int[] digits = new int[6]
	digits[0] = Math.RightShift(Math.LogicalAnd(0xF00000, formID), 20)
	digits[1] = Math.RightShift(Math.LogicalAnd(0x0F0000, formID), 16)
	digits[2] = Math.RightShift(Math.LogicalAnd(0x00F000, formID), 12)
	digits[3] = Math.RightShift(Math.LogicalAnd(0x000F00, formID), 8)
	digits[4] = Math.RightShift(Math.LogicalAnd(0x0000F0, formID), 4)
	digits[5] = Math.LogicalAnd(0x00000F, formID)
	if(highByte < 0xFE)
		filename = Game.GetModName(highByte)
	elseif(highByte == 0xFE)
		int modIndex = Math.RightShift(Math.LogicalAnd(0x00FFF000, formID), 12)
		filename = Game.GetLightModName(modIndex)
		digits[0] = 0
		digits[1] = 0
		digits[2] = 0
	endIf
	string id = filename + "|"
	int i = 0
	while i < 6
		int d = digits[i]
		if(d < 10)
			id += d
		else
			id += StringUtil.AsChar(d + 55);-10 + 65
		endIf
		i += 1
	endWhile
	return id
endFunction

Event OnKeyDown(int keycode)

endEvent
