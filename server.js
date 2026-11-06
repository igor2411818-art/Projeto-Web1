require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pathModule = require('node:path');

const {
    inserirAluno,
    listarAlunos,
    buscarporRa,
    atualizarAluno,
    excluirPorRa,
    inserirCurso,
    listarCurso,
    excluirCurso,
    listarAlunosDoCurso
} = require('./supabase');

const app = express();

const ERRO_CHAVE_ESTRANGEIRA = '23503';

app.use(cors());
app.use(express.json());
app.use(express.static(pathModule.join(__dirname, 'frontend')));


function lerPagina(query) {
    if (
        query.limite === undefined &&
        query.inicio === undefined
    ) {
        return null;
    }

    const limite = Number(query.limite);
    const inicio = query.inicio === undefined
        ? 0
        : Number(query.inicio);

    if (
        !Number.isInteger(limite) ||
        limite < 1 ||
        limite > 100
    ) {
        return { erro: 'Informe limite entre 1 e 100' };
    }

    if (!Number.isInteger(inicio) || inicio < 0) {
        return { erro: 'Inicio inválido' };
    }

    return { inicio, limite };
}

app.get('/alunos', async (req, res) => {
    try {
        const pagina = lerPagina(req.query);

        if (pagina?.erro) {
            return res.status(400).json({ erro: pagina.erro });
        }

        const dados = await listarAlunos(pagina || {});

        res.json(
            pagina
                ? {
                    ...dados,
                    inicio: pagina.inicio,
                    limite: pagina.limite
                }
                : dados
        );
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.get('/alunos/:ra', async (req, res) => {
    try {
        const aluno = await buscarporRa(req.params.ra);

        if (!aluno) {
            return res.status(404).json({
                erro: 'Aluno não encontrado'
            });
        }

        res.json(aluno);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.post('/alunos', async (req, res) => {
    try {
        const { nome, ra } = req.body;
        const curso_id = req.body.curso_id ?? req.body.cursoId;

        if (!nome || !ra || !curso_id) {
            return res.status(400).json({
                erro: 'Campos obrigatórios: nome, ra e curso_id'
            });
        }

        const aluno = await inserirAluno(
            nome,
            ra,
            Number(curso_id)
        );

        res.status(201).json(aluno);
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({
                erro: 'O curso informado não existe'
            });
        }

        res.status(400).json({ erro: e.message });
    }
});

app.put('/alunos/:ra', async (req, res) => {
    try {
        const { nome } = req.body;
        const curso_id = req.body.curso_id ?? req.body.cursoId;

        if (
            (nome === undefined || nome === '') &&
            curso_id === undefined
        ) {
            return res.status(400).json({
                erro: 'Informe nome e/ou curso_id para atualizar'
            });
        }

        const dados = await atualizarAluno(
            req.params.ra,
            nome,
            curso_id === undefined ? undefined : Number(curso_id)
        );

        res.json(dados);
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({
                erro: 'O curso informado não existe'
            });
        }

        res.status(400).json({ erro: e.message });
    }
});

app.delete('/alunos/:ra', async (req, res) => {
    try {
        const dados = await excluirPorRa(req.params.ra);
        res.json(dados);
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

app.get('/cursos', async (req, res) => {
    try {
        const cursos = await listarCurso();
        res.json(cursos);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.post('/cursos', async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'Campo obrigatório: nome'
            });
        }

        const curso = await inserirCurso(nome.trim());

        res.status(201).json(curso);
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
});

app.delete('/cursos/:id', async (req, res) => {
    try {
        const dados = await excluirCurso(req.params.id);
        res.json(dados);
    } catch (e) {
        if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(409).json({
                erro: 'Não é possível excluir: este curso ainda tem alunos'
            });
        }

        res.status(400).json({ erro: e.message });
    }
});

app.get('/cursos/:id/alunos', async (req, res) => {
    try {
        const alunos = await listarAlunosDoCurso(req.params.id);
        res.json(alunos);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Frontend disponível em http://localhost:${PORT}`);
});
