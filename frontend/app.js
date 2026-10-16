
const API_URL = '';

const formAluno = document.getElementById('fora-aluno');
const formCurso = document.getElementById('fora-curso');
const listaEl = document.getElementById('lista');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const raBuscaEl = document.getElementById('ra-busca');
const raEditandoEl = document.getElementById('ra-editando');
const cursoNovoEl = document.getElementById('curso-novo');


function mostrarStatus(texto, tipo = '') {
    statusEl.textContent = texto;
    statusEl.className = `status ${tipo}`.trim();
}


function mostrarLog(titulo, detalhe) {
    const corpo =
        typeof detalhe === 'string'
            ? detalhe
            : JSON.stringify(detalhe, null, 2);

    logEl.textContent = `${titulo}\n\n${corpo}`;
}


async function requisicao(url, opcoes = {}, titulo = '') {
    const resposta = await fetch(url, opcoes);

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.erro || dados.mensagem || 'Falha na requisição'
        );
    }

    if (titulo) {
        mostrarLog(`${titulo} -> ${resposta.status}`, dados);
    }

    return dados;
}


async function listarAlunos() {
    mostrarStatus('Carregando lista...');

    const dados = await requisicao(
        `${API_URL}/alunos`,
        {},
        'GET /alunos'
    );

    renderizarListar(dados);

    mostrarStatus(
        `${dados.length} aluno(s) encontrado(s).`,
        'ok'
    );
}


async function criarAluno(nome, ra, curso) {
    return await requisicao(
        `${API_URL}/alunos`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, ra, curso })
        },
        'POST /alunos'
    );
}


async function buscarPorRa(ra) {
    return await requisicao(
        `${API_URL}/alunos/${encodeURIComponent(ra)}`,
        {},
        `GET /alunos/${ra}`
    );
}

async function atualizarCurso(ra, curso) {
    return await requisicao(
        `${API_URL}/alunos/${encodeURIComponent(ra)}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ curso })
        },
        `PUT /alunos/${ra}`
    );
}


async function excluirAluno(ra) {
    return await requisicao(
        `${API_URL}/alunos/${encodeURIComponent(ra)}`,
        {
            method: 'DELETE'
        },
        `DELETE /alunos/${ra}`
    );
}


function escaparHtml(texto) {
    return String(texto ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}


function renderizarListar(alunos) {
    if (!Array.isArray(alunos)) {
        throw new Error('A API não retornou uma lista de alunos válida.');
    }

    if (alunos.length === 0) {
        listaEl.innerHTML =
            '<p class="vazio">Nenhum aluno ainda. Cadastre o primeiro acima.</p>';
        return;
    }

    listaEl.innerHTML = alunos.map((aluno) => `
        <div class="aluno-item">
            <div class="aluno-info">
                <strong>${escaparHtml(aluno.nome)}</strong>
                <p>RA: ${escaparHtml(aluno.ra)}</p>
                <p>Curso: ${escaparHtml(aluno.curso || 'Não informado')}</p>
            </div>

            <div class="aluno-acoes">
                <button
                    type="button"
                    data-acao="editar"
                    data-ra="${escaparHtml(aluno.ra)}"
                    data-curso="${escaparHtml(aluno.curso || '')}">
                    Editar
                </button>

                <button
                    type="button"
                    data-acao="excluir"
                    data-ra="${escaparHtml(aluno.ra)}">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}


formAluno.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const ra = document.getElementById('ra').value.trim();
    const curso = document.getElementById('curso').value.trim();

    if (!nome || !ra || !curso) {
        mostrarStatus('Preencha todos os campos do aluno.', 'erro');
        return;
    }

    try {
        await criarAluno(nome, ra, curso);

        formAluno.reset();

        mostrarStatus(`Aluno ${nome} cadastrado com sucesso!`, 'ok');

        await listarAlunos();
    } catch (erro) {
        mostrarStatus(erro.message, 'erro');
        mostrarLog('Erro no POST /alunos', erro.message);
    }
});


document.getElementById('btn-buscar').addEventListener(
    'click',
    async () => {
        const ra = raBuscaEl.value.trim();

        if (!ra) {
            mostrarStatus('Digite um RA para buscar.', 'erro');
            return;
        }

        try {
            const aluno = await buscarPorRa(ra);

            formCurso.hidden = false;
            raEditandoEl.textContent = aluno.ra;
            cursoNovoEl.value = aluno.curso || '';

            mostrarStatus(`Aluno encontrado: ${aluno.nome}`, 'ok');
        } catch (erro) {
            formCurso.hidden = true;
            mostrarStatus(erro.message, 'erro');
            mostrarLog(`Erro no GET /alunos/${ra}`, erro.message);
        }
    }
);


formCurso.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const ra = raEditandoEl.textContent.trim();
    const curso = cursoNovoEl.value.trim();

    if (!ra || !curso) {
        mostrarStatus('Informe o RA e o novo curso.', 'erro');
        return;
    }

    try {
        await atualizarCurso(ra, curso);

        mostrarStatus(`Curso do RA ${ra} atualizado com sucesso!`, 'ok');

        await listarAlunos();
    } catch (erro) {
        mostrarStatus(erro.message, 'erro');
        mostrarLog(`Erro no PUT /alunos/${ra}`, erro.message);
    }
});


listaEl.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-acao]');

    if (!botao) return;

    const ra = botao.dataset.ra;
    const acao = botao.dataset.acao;

    try {
        if (acao === 'editar') {
            formCurso.hidden = false;
            raEditandoEl.textContent = ra;
            cursoNovoEl.value = botao.dataset.curso || '';
            raBuscaEl.value = ra;

            cursoNovoEl.focus();

            mostrarStatus(`Editando curso do RA ${ra}.`, 'ok');
            return;
        }

        if (acao === 'excluir') {
            const confirmar = confirm(
                `Deseja realmente excluir o aluno de RA ${ra}?`
            );

            if (!confirmar) return;

            await excluirAluno(ra);

            mostrarStatus(`Aluno de RA ${ra} excluído.`, 'ok');

            await listarAlunos();
        }
    } catch (erro) {
        mostrarStatus(erro.message, 'erro');
        mostrarLog('Erro na ação da lista', erro.message);
    }
});


listarAlunos().catch((erro) => {
    mostrarStatus(
        'Não foi possível conectar à API. Verifique se o servidor está rodando (npm start).',
        'erro'
    );

    mostrarLog('Falha ao conectar', erro.message);
});
