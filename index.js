import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const porta = 3000;
const host = '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'chave-secreta-segura',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1800000, 
        },
    })
);

const usuarios = { 
    admin: '123456'  
};

const mensagens = [];

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/cadastrarUsuario', (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).send('<h1>Todos os campos devem ser preenchidos. <a href="/login">Voltar</a></h1>');
    }

    if (usuarios[nome]) {
        return res.status(400).send('<h1>Usuário já cadastrado. <a href="/login">Voltar</a></h1>');
    }

    usuarios[nome] = senha;
    res.status(201).send('<h1>Usuário cadastrado com sucesso. <a href="/login">Faça login</a></h1>');
});

app.post('/login', (req, res) => {
    req.session.usuario = req.body.usuario || "Usuário";
    req.session.ultimoAcesso = new Date().toISOString();
    res.redirect('/menu');
});


app.get('/menu', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).redirect('/login');
    }

    const ultimoAcesso = req.session.ultimoAcesso;

    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Menu</title>
        </head>
        <body>
            <div class="container mt-5">
                <h1>Bem-vindo, ${req.session.usuario}</h1>
                <p>Último acesso: ${ultimoAcesso}</p>
                <a href="/cadastroUsuario" class="btn btn-primary">Cadastro de Usuários</a>
                <a href="/batePapo" class="btn btn-secondary">Bate-papo</a>
                <a href="/logout" class="btn btn-danger">Logout</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/cadastroUsuario', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).redirect('/login');
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Cadastro de Usuários</title>
        </head>
        <body>
            <div class="container mt-5">
                <h1>Cadastro de Usuários</h1>
                <form action="/cadastrarUsuario" method="POST" class="row g-3">
                    <div class="col-md-6">
                        <label for="nome" class="form-label">Nome:</label>
                        <input type="text" class="form-control" id="nome" name="nome" required>
                    </div>
                    <div class="col-md-6">
                        <label for="senha" class="form-label">Senha:</label>
                        <input type="password" class="form-control" id="senha" name="senha" required>
                    </div>
                    <div class="col-12 mt-3">
                        <button class="btn btn-success" type="submit">Cadastrar</button>
                    </div>
                </form>
                <a href="/menu" class="btn btn-secondary mt-3">Voltar ao Menu</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/batePapo', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).redirect('/login');
    }

    const usuariosOptions = Object.keys(usuarios)
        .map(usuario => `<option value="${usuario}">${usuario}</option>`)
        .join('');

    const mensagensHTML = mensagens
        .map(m => `<p><strong>${m.usuario}:</strong> ${m.mensagem} <em>(${m.data})</em></p>`)
        .join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Bate-Papo</title>
        </head>
        <body>
            <div class="container mt-5">
                <h1>Bate-Papo</h1>
                <div class="mb-3">${mensagensHTML || '<p>Nenhuma mensagem ainda.</p>'}</div>
                <form action="/postarMensagem" method="POST" class="row g-3">
                    <div class="col-md-4">
                        <label for="usuario" class="form-label">Usuário:</label>
                        <select class="form-control" id="usuario" name="usuario" required>
                            <option value="">Selecione um usuário</option>
                            ${usuariosOptions}
                        </select>
                    </div>
                    <div class="col-md-8">
                        <label for="mensagem" class="form-label">Mensagem:</label>
                        <input type="text" class="form-control" id="mensagem" name="mensagem" required>
                    </div>
                    <div class="col-12 mt-3">
                        <button class="btn btn-primary" type="submit">Enviar</button>
                    </div>
                </form>
                <a href="/menu" class="btn btn-secondary mt-3">Voltar ao Menu</a>
            </div>
        </body>
        </html>
    `);
});

app.post('/postarMensagem', (req, res) => {
    const { usuario, mensagem } = req.body;

    if (!usuario || !mensagem) {
        return res.status(400).send('<h1>Usuário e mensagem são obrigatórios. <a href="/batePapo">Voltar</a></h1>');
    }

    mensagens.push({
        usuario,
        mensagem,
        data: new Date().toLocaleString(),
    });

    res.redirect('/batePapo');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao encerrar sessão.');
        }
        res.redirect('/login');
    });
});

app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
});
