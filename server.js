
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('node:path');

const {
    inserirAluno,
    listarAlunos,
    buscarPorRa,
    atualizarAluno,
    excluirPorRa,
    inserirCurso,
    listarCurso,
    excluirCurso,
    listarAlunosDoCurso
} = require('./supabase');

const app = express();

const PORT = process.env.PORT || 3000;
const ERRO_CHAVE_ESTRANGEIRA = '23503';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

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
        return {
            erro: 'Informe um limite entre 1 e 100.'
        };
    }

    if (
        !Number.isInteger(inicio) ||
        inicio < 0
    ) {
        return {
            erro: 'Início inválido.'
        };
    }

    return {
        inicio,
        limite
    };
}

function responderErro(res, erro, status = 500) {
    res.status(status).json({
        erro: erro.message || 'Erro interno do servidor.'
    });
}

function obterCursoId(body) {
    return body.curso_id ?? body.cursoId;
}

function validarCursoId(cursoId) {
    const id = Number(cursoId);

    if (
        cursoId === undefined ||
        cursoId === null ||
        cursoId === '' ||
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

app.get('/alunos', async (req, res) => {
    try {
        const pagina = lerPagina(req.query);

        if (pagina?.erro) {
            return res.status(400).json({
                erro: pagina.erro
            });
        }

        const dados = await listarAlunos(pagina || {});

        if (!pagina) {
            return res.json(dados);
        }

        return res.json({
            ...dados,
            inicio: pagina.inicio,
            limite: pagina.limite
        });
    } catch (erro) {
        return responderErro(res, erro);
    }
});

app.get('/alunos/:ra', async (req, res) => {
    try {
        const aluno = await buscarPorRa(req.params.ra);

        if (!aluno) {
            return res.status(404).json({
                erro: 'Aluno não encontrado.'
            });
        }

        return res.json(aluno);
    } catch (erro) {
        return responderErro(res, erro);
    }
});

app.post('/alunos', async (req, res) => {
    try {
        const { nome, ra } = req.body;
        const cursoId = obterCursoId(req.body);
        const cursoIdValido = validarCursoId(cursoId);

        if (
            typeof nome !== 'string' ||
            !nome.trim() ||
            typeof ra !== 'string' ||
            !ra.trim() ||
            !cursoIdValido
        ) {
            return res.status(400).json({
                erro: 'Informe nome, RA e um curso válido.'
            });
        }

        const aluno = await inserirAluno(
            nome.trim(),
            ra.trim(),
            cursoIdValido
        );

        return res.status(201).json(aluno);
    } catch (erro) {
        if (erro.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({
                erro: 'O curso informado não existe.'
            });
        }

        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Já existe um aluno cadastrado com esse RA.'
            });
        }

        return responderErro(res, erro, 400);
    }
});

app.put('/alunos/:ra', async (req, res) => {
    try {
        const { nome } = req.body;
        const cursoId = obterCursoId(req.body);

        const cursoIdValido = cursoId === undefined
            ? undefined
            : validarCursoId(cursoId);

        if (
            nome === undefined &&
            cursoId === undefined
        ) {
            return res.status(400).json({
                erro: 'Informe nome e/ou curso para atualizar.'
            });
        }

        if (
            nome !== undefined &&
            (typeof nome !== 'string' || !nome.trim())
        ) {
            return res.status(400).json({
                erro: 'Informe um nome válido.'
            });
        }

        if (
            cursoId !== undefined &&
            !cursoIdValido
        ) {
            return res.status(400).json({
                erro: 'Informe um curso válido.'
            });
        }

        const dados = await atualizarAluno(
            req.params.ra,
            nome === undefined ? undefined : nome.trim(),
            cursoIdValido
        );

        if (!dados || dados.length === 0) {
            return res.status(404).json({
                erro: 'Aluno não encontrado.'
            });
        }

        return res.json(dados[0]);
    } catch (erro) {
        if (erro.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(400).json({
                erro: 'O curso informado não existe.'
            });
        }

        return responderErro(res, erro, 400);
    }
});

app.delete('/alunos/:ra', async (req, res) => {
    try {
        const dados = await excluirPorRa(req.params.ra);

        if (!dados || dados.length === 0) {
            return res.status(404).json({
                erro: 'Aluno não encontrado.'
            });
        }

        return res.json({
            mensagem: 'Aluno excluído com sucesso.'
        });
    } catch (erro) {
        return responderErro(res, erro, 400);
    }
});

app.get('/cursos', async (req, res) => {
    try {
        const cursos = await listarCurso();

        return res.json(cursos);
    } catch (erro) {
        return responderErro(res, erro);
    }
});

app.post('/cursos', async (req, res) => {
    try {
        const { nome } = req.body;

        if (
            typeof nome !== 'string' ||
            !nome.trim()
        ) {
            return res.status(400).json({
                erro: 'Informe o nome do curso.'
            });
        }

        const curso = await inserirCurso(nome.trim());

        return res.status(201).json(curso);
    } catch (erro) {
        return responderErro(res, erro, 400);
    }
});

app.delete('/cursos/:id', async (req, res) => {
    try {
        const id = validarCursoId(req.params.id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID do curso inválido.'
            });
        }

        const dados = await excluirCurso(id);

        if (!dados || dados.length === 0) {
            return res.status(404).json({
                erro: 'Curso não encontrado.'
            });
        }

        return res.json({
            mensagem: 'Curso excluído com sucesso.'
        });
    } catch (erro) {
        if (erro.code === ERRO_CHAVE_ESTRANGEIRA) {
            return res.status(409).json({
                erro: 'Não é possível excluir: este curso ainda tem alunos.'
            });
        }

        return responderErro(res, erro, 400);
    }
});

app.get('/cursos/:id/alunos', async (req, res) => {
    try {
        const cursoId = validarCursoId(req.params.id);

        if (!cursoId) {
            return res.status(400).json({
                erro: 'ID do curso inválido.'
            });
        }

        const pagina = lerPagina(req.query);

        if (pagina?.erro) {
            return res.status(400).json({
                erro: pagina.erro
            });
        }

        const dados = await listarAlunosDoCurso(
            cursoId,
            pagina || {}
        );

        if (!pagina) {
            return res.json(dados);
        }

        return res.json({
            ...dados,
            inicio: pagina.inicio,
            limite: pagina.limite
        });
    } catch (erro) {
        return responderErro(res, erro);
    }
});

app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada.'
    });
});

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Frontend disponível em http://localhost:${PORT}`);
});
