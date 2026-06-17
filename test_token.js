import "dotenv/config";
import mongoose from "mongoose";
import UsuarioRepository from "./src/repository/UsuarioRepository.js";
import DbConnect from "./src/config/dbConnect.js";

async function run() {
    await DbConnect.conectar();
    const repo = new UsuarioRepository();
    
    // Find any user
    const doc = await repo.modelUsuario.findOne();
    if (!doc) {
        console.log("No user found");
        process.exit(0);
        return;
    }
    console.log("Before update:", await repo.modelUsuario.findById(doc._id).select('+tokenUnico'));
    
    // Set token
    await repo.atualizar(doc._id, { tokenUnico: "TESTE123" });
    console.log("After set token:", await repo.modelUsuario.findById(doc._id).select('+tokenUnico'));
    
    // Find by token
    let found = await repo.buscarPorTokenUnico("TESTE123");
    console.log("Found by token:", found ? found.tokenUnico : null);
    
    // Atualizar senha
    await repo.atualizarSenha(doc._id, "novaSenhaHash");
    
    // Find again
    console.log("After atualizarSenha:", await repo.modelUsuario.findById(doc._id).select('+tokenUnico +senha'));
    
    // Find by token again
    found = await repo.buscarPorTokenUnico("TESTE123");
    console.log("Found by token after nullify:", found ? found.tokenUnico : null);
    
    process.exit(0);
}

run();
