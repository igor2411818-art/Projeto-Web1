require('dotenv').config();

const path = require('express');

const express = require ('express');

const cors = require('cors');

const { inserirAluno, listarAlunos, buscarporRa, buscarPorNome, 
    atualizarCurso, excluirPorRa
} = require('./supabase');  

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname,'frontend')));

app.get('/alunos', async (req, res) => {
    try {
        const dados = await listarAlunos();
        res.json(dados);
    } catch (e) {
        res.status(500).json({erro: e.message });
    }
});

app.get('/alunos/:ra', async (req, res) => {
    try {
        const alunos = await buscarporRa(req.params.ra);
        if(!alunos) return res.status(404).json({ erro: 'Aluno não encontrado'});
        res.json(alunos);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.post('/alunos', async (req, res) => {
    try{
        const {nome, ra, curso } = req.body;

        if(!nome || !ra) {
            return res.status(400).json({
                erro: 'Campo obrigatórios: nome e ra',
            });
        }

        const alunos = await inserirAluno(nome, ra, curso);

        res.status(201).json(aluno);
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

app.put('/alunos/:ra', async (req, res) => {
    try {
          const data =  await atualizarCurso(req.params.ra, req.body.curso);
          res.json(data);
            } catch (e) {
                res.status(400).json({ erro: e.message });
            }
});

app.delete('/alunos/:ra', async (req, res) => {
    try {
        const data = await excluirPorRa(req.params.ra);
        res.json(data);
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log('Frontend')
}); 