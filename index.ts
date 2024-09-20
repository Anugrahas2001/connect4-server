import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import http from "http";

const app = express();
const port = 3000;
console.log(port, "3000");

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173","https://connect4-client-anugraha-ss-projects.vercel.app/"],
    methods: ["GET", "POST"],
  },
});

type Game = {
  board: (string | null)[][];
  players: { [key: string]: string };
  currentPlayer: string;
};

let game: Game = {
  board: Array(6)
    .fill(null)
    .map(() => Array(7).fill(null)),
  players: {},
  currentPlayer: "red",
};
console.log(game.board, "board");

io.on("connection", (socket: Socket) => {
  console.log(`Player is connected with id ${socket.id}`);

  socket.on("joinGame", () => {
    let playersCount = Object.keys(game.players).length;
    console.log(playersCount, "count");
    if (playersCount < 2) {
      console.log("started");
      const color = playersCount === 0 ? "red" : "yellow";
      console.log(color, "checking");
      game.players[socket.id] = color;
      console.log(`player ${socket.id} joined as color ${color}`);

      socket.emit("playerColor", { color });

      if (Object.keys(game.players).length === 2) {
        console.log("Two players joined");
        io.emit("opponentJoined");
      }
    }
  });

  socket.on("makeMove", ({column}) => {
    console.log(column, "column");

    let gameBoard = game.board;
    let currentPlayer = game.players[socket.id];
    let row = -1;

    for (let r = game.board.length - 1; r >= 0; r--) {
      if (!gameBoard[r][column]) {
        row = r;
        break;
      }
    }

    if (row != -1) {
      gameBoard[row][column] = currentPlayer;
      console.log("updated gameBoard", gameBoard);
      io.emit("updatedBoard", {
        board: gameBoard,
        currentPlayer: currentPlayer === "red" ? "yellow" : "red",
      });
    }

    const winner = checkWinner(gameBoard);
    if (winner) {
      io.emit("gameOver", { winner });
    } else {
      game.currentPlayer = currentPlayer === "red" ? "yellow" : "red";
    }
  });

  socket.on("disconnect", () => {
    console.log(`player with id ${socket.id} disconnected`);
    delete game.players[socket.id];
  });

  socket.on("newGame", () => {
    (game.board = Array(6)
      .fill(null)
      .map(() => Array(7).fill(null))),
      (game.currentPlayer = "red");

    io.emit("updatedBoard", {
      board: game.board,
      currentPlayer: game.currentPlayer,
    });
  });
});

const checkWinner = (board: (string | null)[][]): string | null => {
  const rows = board.length;
  const cols = board[0].length;

  const checkSequence = (sequence: (string | null)[]): boolean => {
    return sequence.every((cell) => cell !== null && cell === sequence[0]);
  };

  //horizontal check
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 3; col++) {
      const sequence = [
        board[row][col],
        board[row][col + 1],
        board[row][col + 2],
        board[row][col + 3],
      ];

      if (checkSequence(sequence)) {
        return board[row][col];
      }
    }
  }

  //vertical check
  for (let row = 0; row < rows - 3; row++) {
    for (let col = 0; col < cols; col++) {
      const sequence = [
        board[row][col],
        board[row + 1][col],
        board[row + 2][col],
        board[row + 3][col],
      ];

      if (checkSequence(sequence)) {
        return board[row][col];
      }
    }
  }

  //diagonal check (bottom to top)
  for (let row = 0; row < rows - 3; row++) {
    for (let col = 0; col < cols - 3; col++) {
      const sequence = [
        board[row][col],
        board[row + 1][col + 1],
        board[row + 2][col + 2],
        board[row + 3][col + 3],
      ];

      if (checkSequence(sequence)) {
        return board[row][col];
      }
    }
  }

  //diagonal check (top to bottom)
  for (let row = 3; row < rows; row++) {
    for (let col = 0; col < cols - 3; col++) {
      const sequence = [
        board[row][col],
        board[row - 1][col + 1],
        board[row - 2][col + 2],
        board[row - 3][col + 3],
      ];

      if (checkSequence(sequence)) {
        return board[row][col];
      }
    }
  }

  return null;
};

server.listen(3000, () => console.log(`Server is running at port 3000`));
