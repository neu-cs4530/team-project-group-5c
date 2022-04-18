import { Socket } from 'socket.io';

export default function minigameSubscriptionHandler(socket: Socket): void {

  // When the socket receives a join minigame message, a unique minigame label needs to be passed
  // and a socket room will be created with that minigame label.
  // This will emit a message to the player that they have joined the game room
  socket.on('join_game_room', async (minigameLabel: string) => {
    await socket.join(minigameLabel);
    socket.emit(`${minigameLabel}_room_joined`);
  });

  // When the host starts the game, this socket listener listens for the start_game message. 
  // Once the message is received, the host client gets a host_start_game message while the guest in the room receives a game started message
  socket.on('start_game', async (minigameLabel: string) => {
    socket.emit('host_start_game');
    socket.to(minigameLabel).emit(`${minigameLabel}_game_started`);
  });
}