require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        'Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env'
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


async function inserirAluno(nome, ra, curso) {

    const { data, error } = await supabase
        .from('alunos')
        .insert([{ nome, ra, curso }])
        .select()
        .single();

    if (error) throw error;

    return data;
}


async function listarAlunos() {

    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('id', { ascending: true });

    if (error) throw error;

    return data;
}




async function buscarporRa(ra) {

    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('ra', ra)
        .maybeSingle();

    if (error) throw error;

    return data;
}


async function buscarPorNome(parteNome) {

    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .ilike('nome', `%${parteNome}%`)
        .order('id', { ascending: true });

    if (error) throw error;

    return data;
}


async function atualizarCurso(ra, curso) {

    const { data, error } = await supabase
        .from('alunos')
        .update({ curso })
        .eq('ra', ra)
        .select();

    if (error) throw error;

    return data;
}


async function excluirPorRa(ra) {

    const { data, error } = await supabase
        .from('alunos')
        .delete()
        .eq('ra', ra)
        .select();

    if (error) throw error;

    return data;
}


module.exports = {
    supabase,
    inserirAluno,
    listarAlunos,
    buscarporRa,
    buscarPorNome,
    atualizarCurso,
    excluirPorRa
};
