import express from "express"
import http from "http"
import { Server } from "socket.io"
import formatMessage from "./utiles/messages.js"
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from "./utiles/users.js"

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const admin = "admin"

app.use(express.static("./public"))

// Run when the client connects
io.on("connection", (socket) => {
	socket.on("joinRoom", ({ username, room }) => {
		const user = userJoin(socket.id, username, room)

		socket.join(user.room)

		// you only well see it
		socket.emit("message", formatMessage(admin, "welcome to the room"))
		// Broadcast when a user connects (ALL will see expect you)
		socket.broadcast
			.to(user.room)
			.emit("message", formatMessage(admin, `${username} has joined the chat`))

		// send users and room info.
		io.to(user.room).emit("roomUsers", {
			room: user.room,
			users: getRoomUsers(user.room),
		})
	})

	// Listen to messages
	socket.on("chatMessage", (chatMessage) => {
		const user = getCurrentUser(socket.id)
		io.to(user.room).emit("message", formatMessage(user.username, chatMessage))
	})

	// Runs when a client disconnects
	socket.on("disconnect", () => {
		const user = userLeave(socket.id)
		// emit to all in general
		if (user) {
			io.to(user.room).emit("message", formatMessage(admin, `${user.username} has left the chat`))
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: getRoomUsers(user.room),
			})
		}
	})
})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}....`)
})
