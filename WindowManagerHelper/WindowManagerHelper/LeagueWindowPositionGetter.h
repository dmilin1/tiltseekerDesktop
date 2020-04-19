#pragma once

#include <tuple>

class LeagueWindowPositionGetter
{
public:
	// Returns window position in the order {left, top, bottom, right}
	static std::tuple<int, int, int, int> GetLeagueWindowPosition();
};