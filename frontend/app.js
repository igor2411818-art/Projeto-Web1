
const API_URL = '';
const ALUNOS_POR_PAGINA = 5;

let alunosInicio = 0;
let alunosTotal = 0;
let alunosTemMais = false;
let alunosCarregando = false;
let alunosErro = false;
let alunosPedido = 0;
let alunosBusca = '';

let modo = 'criar';
let raEditando = '';

const statusAlunos = document.getElementById('alunos-status');
const sentinelaAlunos = document.getElementById('sentinela-alunos');

const tabela = document.getElementById('tabela-alunos');
const tabelaCursos = document.getElementById('tabela-cursos');

const msg = document.getElementById('msg');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');

const form = document.getElementById('form-aluno');
const formCurso = document.getElementById('form-curso');

const inputNome = document.getElementById('nome');
const inputRa = document.getElementById('ra');
const selectCurso = document.getElementById('curso');
const filtroCurso = document.getElementById('filtro-curso');
const inputNovoCurso = document.getElementById('novo-curso');

const inputBusca = document.getElementById('busca');
const criterioPesquisa = document.getElementById('criterio-pesquisa');

function mostrarMsg(texto, tipo = '') {
    msg.hidden = false;
    msg.textContent = texto;
    msg.className = 'msg' + (tipo ? ` ${tipo}` : '');
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(`${API_URL}${url}`, opcoes);
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.erro || dados.mensagem || 'Erro na requisição.'
        );
    }

    return dados;
}

function atualizarStatusAlunos() {
    if (!statusAlunos) return;

    if (alunosErro) {
        statusAlunos.textContent =
            'A lista não carregou. Use Atualizar lista para tentar de novo.';
        return;
    }

    if (alunosCarregando && alunosInicio === 0) {
        statusAlunos.textContent = 'Carregando...';
        return;
    }

    if (!alunosTotal) {
        statusAlunos.textContent = 'Nenhum aluno para mostrar.';
        return;
    }

    if (alunosCarregando) {
        statusAlunos.textContent =
            `Mostrando ${alunosInicio} de ${alunosTotal}. Carregando mais...`;
        return;
    }

    if (alunosTemMais) {
        statusAlunos.textContent =
            `Mostrando ${alunosInicio} de ${alunosTotal}. Role a tela para carregar mais.`;
        return;
    }

    statusAlunos.textContent =
        `Mostrando ${alunosInicio} de ${alunosTotal}. Fim da lista.`;
}

async function listarCursos() {
    try {
        const cursos = await requisicao('/cursos');

        montarTabelaCursos(cursos);
        preencherSelects(cursos);
    } catch (erro) {
        mostrarMsg(erro.message, 'erro');
    }
}

function montarTabelaCursos(cursos) {
    tabelaCursos.innerHTML = '';

    if (!cursos.length) {
        tabelaCursos.innerHTML = `
            <tr>
                <td colspan="3" class="vazio">
                    Nenhum curso cadastrado ainda.
                </td>
            </tr>
        `;
        return;
    }

    for (const curso of cursos) {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = curso.nome;

        const tdTotal = document.createElement('td');
        tdTotal.textContent = curso.total_alunos ?? 0;

        const tdAcoes = document.createElement('td');

        const btnVer = document.createElement('button');
        btnVer.textContent = 'Ver alunos';
        btnVer.className = 'btn btn-secundario btn-pequeno';

        btnVer.onclick = () => {
            filtroCurso.value = curso.id;
            listarAlunos(false);
        };

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn btn-perigo btn-pequeno';

        btnExcluir.onclick = () => excluirCurso(curso.id, curso.nome);

        tdAcoes.append(btnVer, btnExcluir);
        tr.append(tdNome, tdTotal, tdAcoes);

        tabelaCursos.appendChild(tr);
    }
}

function preencherSelects(cursos) {
    const filtroAtual = filtroCurso.value;
    const cursoAtual = selectCurso.value;

    filtroCurso.innerHTML =
        '<option value="">Todos os cursos</option>';

    selectCurso.innerHTML =
        '<option value="">Selecione um curso</option>';

    for (const curso of cursos) {
        filtroCurso.appendChild(
            new Option(curso.nome, curso.id)
        );

        selectCurso.appendChild(
            new Option(curso.nome, curso.id)
        );
    }

    filtroCurso.value = filtroAtual;
    selectCurso.value = cursoAtual;

    if (filtroCurso.selectedIndex === -1) {
        filtroCurso.value = '';
    }

    if (selectCurso.selectedIndex === -1) {
        selectCurso.value = '';
    }
}

async function adicionarCurso(evento) {
    evento.preventDefault();

    const nome = inputNovoCurso.value.trim();

    if (!nome) {
        mostrarMsg('Informe o nome do curso.', 'erro');
        return;
    }

    try {
        const dados = await requisicao('/cursos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome })
        });

        inputNovoCurso.value = '';

        mostrarMsg(
            `Curso "${dados.nome}" cadastrado com sucesso!`,
            'ok'
        );

        await atualizarTudo();
    } catch (erro) {
        mostrarMsg(erro.message, 'erro');
    }
}

async function excluirCurso(id, nome) {
    if (!confirm(`Deseja excluir o curso "${nome}"?`)) {
        return;
    }

    try {
        await requisicao(
            `/cursos/${encodeURIComponent(id)}`,
            {
                method: 'DELETE'
            }
        );

        mostrarMsg('Curso excluído com sucesso!', 'ok');

        await atualizarTudo();
    } catch (erro) {
        mostrarMsg(erro.message, 'erro');
    }
}

function abrirModalCriar() {
    if (selectCurso.options.length <= 1) {
        mostrarMsg(
            'Cadastre um curso antes de incluir alunos.',
            'erro'
        );
        return;
    }

    modo = 'criar';
    raEditando = '';

    modalTitulo.textContent = 'Novo aluno';

    form.reset();
    inputRa.disabled = false;

    modal.hidden = false;
    inputNome.focus();
}

function abrirModalEditar(aluno) {
    modo = 'editar';
    raEditando = aluno.ra;

    modalTitulo.textContent = 'Editar aluno';

    inputNome.value = aluno.nome || '';
    inputRa.value = aluno.ra || '';
    selectCurso.value = aluno.curso_id || '';

    inputRa.disabled = true;

    modal.hidden = false;
    inputNome.focus();
}

function fecharModal() {
    modal.hidden = true;

    form.reset();
    inputRa.disabled = false;

    modo = 'criar';
    raEditando = '';
}

async function salvarAluno(evento) {
    evento.preventDefault();

    const nome = inputNome.value.trim();
    const ra = inputRa.value.trim();
    const cursoId = Number(selectCurso.value);

    if (!nome || !ra || !cursoId) {
        mostrarMsg(
            'Preencha todos os campos do aluno.',
            'erro'
        );
        return;
    }

    try {
        if (modo === 'criar') {
            await requisicao('/alunos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome,
                    ra,
                    cursoId
                })
            });

            mostrarMsg(
                `Aluno "${nome}" cadastrado com sucesso!`,
                'ok'
            );
        } else {
            await requisicao(
                `/alunos/${encodeURIComponent(raEditando)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome,
                        cursoId
                    })
                }
            );

            mostrarMsg(
                `Aluno "${nome}" atualizado com sucesso!`,
                'ok'
            );
        }

        fecharModal();
        await atualizarTudo();
    } catch (erro) {
        mostrarMsg(erro.message, 'erro');
    }
}

function montarTabelaAlunos(alunos, acrescentar = false) {
    if (!acrescentar) {
        tabela.innerHTML = '';
    }

    if (!alunos.length && !acrescentar) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="vazio">
                    Nenhum aluno encontrado.
                </td>
            </tr>
        `;
        return;
    }

    for (const aluno of alunos) {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = aluno.nome;

        const tdRa = document.createElement('td');
        tdRa.textContent = aluno.ra;

        const tdCurso = document.createElement('td');
        tdCurso.textContent = aluno.curso?.nome || '—';

        const tdAcoes = document.createElement('td');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn btn-secundario btn-pequeno';

        btnEditar.onclick = () => abrirModalEditar(aluno);

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn btn-perigo btn-pequeno';

        btnExcluir.onclick = () => {
            excluirAluno(aluno.ra, aluno.nome);
        };

        tdAcoes.append(btnEditar, btnExcluir);
        tr.append(tdNome, tdRa, tdCurso, tdAcoes);

        tabela.appendChild(tr);
    }
}

async function listarAlunos(acrescentar = false) {
    if (alunosCarregando) return;

    if (acrescentar && !alunosTemMais) return;

    if (!acrescentar) {
        alunosPedido++;
        alunosInicio = 0;
        alunosTotal = 0;
        alunosTemMais = false;
        alunosErro = false;

        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="vazio">
                    Carregando...
                </td>
            </tr>
        `;
    }

    const pedido = alunosPedido;
    const inicio = acrescentar ? alunosInicio : 0;
    const cursoId = filtroCurso.value;

    const base = cursoId
        ? `/cursos/${encodeURIComponent(cursoId)}/alunos`
        : '/alunos';

    const params = new URLSearchParams({
        inicio: String(inicio),
        limite: String(ALUNOS_POR_PAGINA)
    });

    if (alunosBusca) {
        params.set('busca', alunosBusca);
    }

    alunosCarregando = true;
    alunosErro = false;

    atualizarStatusAlunos();

    try {
        const dados = await requisicao(
            `${base}?${params.toString()}`
        );

        if (pedido !== alunosPedido) return;

        const alunos = Array.isArray(dados)
            ? dados
            : dados.alunos || [];

        alunosTotal = Array.isArray(dados)
            ? alunos.length
            : dados.total ?? 0;

        montarTabelaAlunos(alunos, acrescentar);

        alunosInicio = inicio + alunos.length;

        alunosTemMais = alunosInicio < alunosTotal;

        if (!alunos.length) {
            alunosTemMais = false;
        }
    } catch (erro) {
        if (pedido === alunosPedido) {
            alunosErro = true;
            mostrarMsg(erro.message, 'erro');

            if (!acrescentar) {
                tabela.innerHTML = `
                    <tr>
                        <td colspan="4" class="vazio">
                            Não foi possível carregar os alunos.
                        </td>
                    </tr>
                `;
            }
        }
    } finally {
        if (pedido === alunosPedido) {
            alunosCarregando = false;
            atualizarStatusAlunos();
        }
    }
}

async function excluirAluno(ra, nome) {
    if (!confirm(`Deseja excluir o aluno "${nome}"?`)) {
        return;
    }

    try {
        await requisicao(
            `/alunos/${encodeURIComponent(ra)}`,
            {
                method: 'DELETE'
            }
        );

        mostrarMsg('Aluno excluído com sucesso!', 'ok');

        await atualizarTudo();
    } catch (erro) {
        mostrarMsg(erro.message, 'erro');
    }
}

async function atualizarTudo() {
    await listarCursos();
    await listarAlunos(false);
}

function pedirMaisSeVisivel() {
    if (
        !sentinelaAlunos ||
        !alunosTemMais ||
        alunosCarregando ||
        alunosErro
    ) {
        return;
    }

    const topo = sentinelaAlunos.getBoundingClientRect().top;

    if (topo <= window.innerHeight + 160) {
        listarAlunos(true);
    }
}

function atualizarCriterioPesquisa() {
    if (!criterioPesquisa) return;

    criterioPesquisa.innerHTML = '';

    if (!alunosBusca) {
        criterioPesquisa.hidden = true;
        return;
    }

    const rotulo = document.createElement('span');
    rotulo.className = 'criterio-rotulo';
    rotulo.textContent = 'Critério de pesquisa:';

    const nuvem = document.createElement('span');
    nuvem.className = 'nuvem-filtro';

    const texto = document.createElement('span');
    texto.className = 'nuvem-filtro-texto';
    texto.textContent = alunosBusca;

    const btnLimpar = document.createElement('button');
    btnLimpar.type = 'button';
    btnLimpar.className = 'nuvem-filtro-limpar';
    btnLimpar.textContent = '×';

    btnLimpar.addEventListener('click', limparBusca);

    nuvem.append(texto, btnLimpar);
    criterioPesquisa.append(rotulo, nuvem);

    criterioPesquisa.hidden = false;
}

function limparBusca() {
    if (inputBusca) {
        inputBusca.value = '';
    }

    alunosBusca = '';

    atualizarCriterioPesquisa();
    listarAlunos(false);
}

function pesquisarAlunos() {
    if (!inputBusca) return;

    alunosBusca = inputBusca.value.trim();

    atualizarCriterioPesquisa();
    listarAlunos(false);
}

filtroCurso.addEventListener('change', () => {
    listarAlunos(false);
});

if (inputBusca) {
    inputBusca.addEventListener('input', pesquisarAlunos);
}

window.addEventListener('scroll', pedirMaisSeVisivel, {
    passive: true
});

window.addEventListener('resize', pedirMaisSeVisivel);

document.getElementById('btn-novo')?.addEventListener(
    'click',
    abrirModalCriar
);

document.getElementById('btn-novo-aluno')?.addEventListener(
    'click',
    abrirModalCriar
);

document.getElementById('btn-atualizar')?.addEventListener(
    'click',
    atualizarTudo
);

document.getElementById('btn-cancelar')?.addEventListener(
    'click',
    fecharModal
);

document.getElementById('modal-fundo')?.addEventListener(
    'click',
    fecharModal
);

document.querySelectorAll('[data-fechar-modal]').forEach(botao => {
    botao.addEventListener('click', fecharModal);
});

form.addEventListener('submit', salvarAluno);
formCurso.addEventListener('submit', adicionarCurso);

atualizarTudo().catch(erro => {
    mostrarMsg(
        `Erro ao carregar o sistema: ${erro.message}`,
        'erro'
    );
});
