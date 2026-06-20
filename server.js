// server.js

import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";

const port = process.env.APP_PORT || process.env.API_PORT || 5020;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

// Compartilha o io com as rotas/controllers
app.set('io', io);

io.on("connection", (socket) => {
    socket.on("joinOrderRoom", (orderId) => {
        socket.join(orderId);
    });

    socket.on("joinRestaurantRoom", (restauranteId) => {
        socket.join(`restaurante_${restauranteId}`);
    });
});

server.listen(port, (error) => {
    if (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
    if (process.env.NODE_ENV === "production") {
        console.log(`Servidor escutando na porta: ${port} em produção`);
    } else {
        console.log(`Servidor escutando em http://localhost:${port}`);
    }
});
