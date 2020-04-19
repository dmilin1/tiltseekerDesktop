#pragma once

#include <tuple>

class LeagueWindowPositionGetter
{
public:
	// Returns the League client's window position in the order {left, top, bottom, right}
	static std::tuple<int, int, int, int> GetLeagueWindowPosition();
	// Returns true if the League client's window has focus; false otherwise
	static bool LeagueIsInForeground();
};