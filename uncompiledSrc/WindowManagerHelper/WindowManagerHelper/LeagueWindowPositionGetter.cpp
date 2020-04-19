#include "LeagueWindowPositionGetter.h"

#include <Windows.h>

std::tuple<int, int, int, int> LeagueWindowPositionGetter::GetLeagueWindowPosition()
{
	static HWND leagueClientWindow = FindWindow(nullptr, TEXT("League of Legends"));
	RECT windowPosOut;
	GetWindowRect(leagueClientWindow, &windowPosOut);
	return {windowPosOut.left, windowPosOut.top, windowPosOut.bottom, windowPosOut.right};
}