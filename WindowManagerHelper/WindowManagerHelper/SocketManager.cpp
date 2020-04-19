#include "SocketManager.h"
#include <stdexcept>
#include <algorithm>
#include <string>

#pragma comment (lib, "Ws2_32.lib")
#pragma comment (lib, "Mswsock.lib")
#pragma comment (lib, "AdvApi32.lib")

SocketManager::SocketManager(uint16_t port)
{
	InitializeWinsock();
	Connect(port);
}

SocketManager::~SocketManager()
{
	if (mSocket != INVALID_SOCKET)
		closesocket(mSocket);
	WSACleanup();
}

void SocketManager::SendLeagueClientDimensions(int top, int left, int bottom, int right)
{
	std::string sendBuffer = std::to_string(left) + ", " + std::to_string(top) + ", " + std::to_string(bottom) + ", " + std::to_string(right);
	int retv = send(mSocket, sendBuffer.c_str(), sendBuffer.size(), 0);
	if (retv == SOCKET_ERROR)
		throw std::runtime_error("send failed");
}

bool SocketManager::CheckForTerminationMessage()
{
	// Check if there are any bytes available before trying to read from the socket.
	u_long availableBytesOut = 0;
	ioctlsocket(mSocket, FIONREAD, &availableBytesOut);
	if (availableBytesOut != 0)
	{
		static char buf[512];
		// Grab the data.
		// TODO - check whether the data is actually a shutdown message.
		int bytesReceived = recv(mSocket, buf, std::max(static_cast<size_t>(availableBytesOut), sizeof(buf)), 0);
		if (bytesReceived == SOCKET_ERROR)
			throw std::runtime_error("receive failed");
		return true;
	}
	return false;
}

void SocketManager::InitializeWinsock()
{
	WSADATA temp;
	if (WSAStartup(MAKEWORD(2, 2), &temp) != 0)
		throw std::runtime_error("winsock initialization failed");
}

void SocketManager::Connect(uint16_t port)
{
	mSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
	if (mSocket == INVALID_SOCKET)
		throw std::runtime_error("socket creation failed");

	sockaddr_in address{};
	address.sin_family = AF_INET;
	address.sin_port = htons(port);
	inet_pton(AF_INET, "127.0.0.1", &address.sin_addr.s_addr);

	if (connect(mSocket, reinterpret_cast<sockaddr*>(&address), sizeof(sockaddr_in)) != 0)
		throw std::runtime_error("couldn't establish a connection with the Tiltseeker app");
}
