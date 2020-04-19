#pragma once

#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <cinttypes>
#undef min
#undef max

class SocketManager
{
public:
	SocketManager(uint16_t port);
	~SocketManager();
	SocketManager(const SocketManager&) = delete;
	SocketManager& operator=(const SocketManager&) = delete;
	SocketManager(SocketManager&&) = delete;
	SocketManager& operator=(SocketManager&&) = delete;

	void SendLeagueClientDimensions(int top, int left, int bottom, int right);
	bool CheckForTerminationMessage();

private:
	void InitializeWinsock();
	void Connect(uint16_t port);

	SOCKET mSocket = INVALID_SOCKET;
};