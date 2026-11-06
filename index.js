
const {
    inserirAluno,
    listarAlunos,
    atualizarAluno,
    inserirCurso,
    listarCurso,
    listarAlunosDoCurso
} = require('./supabase');

async function main() {
    try {
        console.log('\n===== INICIANDO TESTES =====\n');

        const nomesCursos = ['ADS', 'Gestão Comercial'];

        let cursos = await listarCurso();

        for (const nome of nomesCursos) {
            const existe = cursos.some(
                (curso) => curso.nome === nome
            );

            if (!existe) {
                try {
                    await inserirCurso(nome);
                    console.log(`Curso "${nome}" cadastrado!`);
                } catch (erro) {
                    console.error(
                        `Erro ao cadastrar "${nome}":`,
                        erro.message
                    );
                }
            } else {
                console.log(`Curso "${nome}" já existe.`);
            }
        }

        cursos = await listarCurso();

        console.log('\n===== CURSOS CADASTRADOS =====');
        console.table(cursos);

        const ads = cursos.find(
            (curso) => curso.nome === 'ADS'
        );

        const gestao = cursos.find(
            (curso) => curso.nome === 'Gestão Comercial'
        );

        if (!ads || !gestao) {
            throw new Error(
                'Não foi possível encontrar os cursos necessários.'
            );
        }

        console.log('\n===== CADASTRO DE ALUNO =====');

        try {
            const novo = await inserirAluno(
                'Maria Silva',
                '2026001',
                ads.id
            );

            console.log('Aluno cadastrado com sucesso:');
            console.log(novo);

        } catch (erro) {
            console.log(
                'Aluno não cadastrado:',
                erro.message
            );
        }

        console.log('\n===== LISTA DE ALUNOS =====');

        const todos = await listarAlunos();

        console.log(`Total de alunos: ${todos.length}`);
        console.table(todos);

        console.log('\n===== ATUALIZANDO ALUNO =====');

        const alunoExiste = todos.some(
            (aluno) => aluno.ra === '2026001'
        );

        if (alunoExiste) {
            const atualizado = await atualizarAluno(
                '2026001',
                'Maria Silva',
                gestao.id
            );

            console.log('Aluno atualizado com sucesso:');
            console.log(atualizado);
        } else {
            console.log(
                'Aluno com RA 2026001 não encontrado.'
            );
        }

        console.log('\n===== ALUNOS DE GESTÃO COMERCIAL =====');

        const alunosGestao = await listarAlunosDoCurso(
            gestao.id
        );

        console.table(alunosGestao);

        console.log('\n===== TESTES FINALIZADOS =====');

    } catch (erro) {
        console.error('\nERRO GERAL:', erro.message || erro);
    }
}

main();
