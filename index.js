const {
    supabase,
    inserirAluno,
    listarAlunos,
    buscarporRa,
    buscarPorNome,
    atualizarCurso,
    excluirPorRa,
} = require('./supabase');

async function main() {
    try {
        try {
            const novo = await inserirAluno('Maria Silva', '2026001', 'ADS');
            console.log('Inserido com sucesso:', novo);
        } catch (e) {
            console.log(
                'Não inseriu (talvez o RA já exista):',
                e.message || e
            );
        }

        const todos = await listarAlunos();
        console.log(`Total: ${todos.length}`, todos);

        const um = await buscarporRa('2026001');
        console.log(um ?? 'Não encontrado');

        const atualizados = await atualizarCurso(
            '2026001',
            'Gestão Comercial'
        );
        console.log('Aluno atualizado:', atualizados);

        const filtrados = await buscarPorNome('Maria');
        console.log('Alunos encontrados:', filtrados);

    } catch (err) {
        console.error('ERRO GERAL:', err.message || err);
    }
}

main();
