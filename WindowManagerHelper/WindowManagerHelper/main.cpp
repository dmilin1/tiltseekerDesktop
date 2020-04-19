#include "LeagueWindowPositionGetter.h"
#include "SocketManager.h"

#include <iostream>
#include <chrono>
#include <string>

int main(int argc, char** argv)
{
	if (argc != 3)
	{
		std::cout << std::string("Usage: ") + argv[0] + " <port> <delay between updates in milliseconds>" << std::endl;
		return EXIT_FAILURE;
	}

	try
	{
		SocketManager man(std::stoi(argv[1]));
		int delay = std::stoi(argv[2]);
		while (!man.CheckForTerminationMessage())
		{
			if (LeagueWindowPositionGetter::LeagueIsInForeground())
				man.SendLeagueClientDimensions(LeagueWindowPositionGetter::GetLeagueWindowPosition());
			else
				man.SendString("background");
			Sleep(delay);
		}
	}
	catch (std::runtime_error& e)
	{
		std::cout << std::string("Fatal: ") + e.what() << std::endl;
		return EXIT_FAILURE;
	}
	return EXIT_SUCCESS;
}