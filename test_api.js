import "dotenv/config";
import mongoose from "mongoose";
import fetch from "node-fetch"; // need to use global fetch or node-fetch
import UsuarioRepository from "./src/repository/UsuarioRepository.js";
import DbConnect from "./src/config/dbConnect.js";
import TokenUtil from "./src/utils/TokenUtil.js";

async function run() {
    await DbConnect.conectar();
    const repo = new UsuarioRepository();
    
    // Find any user
    const doc = await repo.modelUsuario.findOne();
    if (!doc) return console.log("No user found");
    
    const token = TokenUtil.generateRecoveryCode();
    await repo.atualizar(doc._id, { 
        tokenUnico: token, 
        exp_codigo_recupera_senha: new Date(Date.now() + 3600000) 
    });
    console.log("Token set for user:", doc.email, "Token:", token);
    
    const apiUrl = "https://rango-api-qa.eduardotartas.dpdns.org/password/reset?token=" + token;
    
    // Request 1
    console.log("--- REQUEST 1 ---");
    let res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: "newPassword123" })
    });
    let data = await res.json();
    console.log("Response 1:", res.status, data);
    
    // Request 2
    console.log("--- REQUEST 2 ---");
    let res2 = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: "anotherPassword" })
    });
    let data2 = await res2.json();
    console.log("Response 2:", res2.status, data2);
    
    process.exit(0);
}

run();
