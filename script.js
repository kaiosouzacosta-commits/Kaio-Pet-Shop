const API_ENDPOINTS = {
    dogImages: 'https://dog.ceo/api/breeds/image/random/4',
    dogBreeds: 'https://dog.ceo/api/breeds/list/all',
    postsApi: 'https://jsonplaceholder.typicode.com/posts',
    viaCep: 'https://viacep.com.br/ws/'
};

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

function obterCarrinho() {
    try {
        return JSON.parse(localStorage.getItem('kaio_pet_carrinho')) || [];
    } catch (e) {
        return [];
    }
}

function salvarCarrinho(itens) {
    localStorage.setItem('kaio_pet_carrinho', JSON.stringify(itens));
    atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
    const badge = document.getElementById('header-cart');
    if (!badge) return;
    const itens = obterCarrinho();
    badge.textContent = `Carrinho (${itens.length})`;
}

function atualizarHeaderAuth() {
    const btn = document.getElementById('header-auth-btn');
    if (!btn) return;
    const usuario = JSON.parse(localStorage.getItem('kaio_pet_usuario'));
    if (usuario && usuario.nome) {
        btn.textContent = usuario.nome.split(' ')[0];
    } else {
        btn.textContent = 'Entrar';
    }
}

function configurarMenuMobile() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav-links');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }
}

async function carregarGaleriaSobreApi() {
    const container = document.getElementById('sobre-api-gallery');
    if (!container) return;

    try {
        const resposta = await fetch(API_ENDPOINTS.dogImages);
        const dados = await resposta.json();
        const nomes = ['Thor', 'Luna', 'Max', 'Mel'];

        container.innerHTML = dados.message.map((imgUrl, index) => `
            <div class="card">
                <img src="${imgUrl}" alt="Pet atendido">
                <h3>${nomes[index] || 'Pet'}</h3>
                <p>Atendido com carinho na nossa unidade.</p>
            </div>
        `).join('');
    } catch (erro) {
        container.innerHTML = '<p>Não foi possível carregar as imagens no momento.</p>';
    }
}

async function carregarProdutosApi() {
    const lista = document.getElementById('produtos-lista');
    if (!lista) return;

    const catalogoBase = [
        { id: 1, nome: 'Ração Super Premium Cães 15kg', categoria: 'racao', preco: 189.90, desc: 'Nutrição completa com proteínas selecionadas e ômega 3.' },
        { id: 2, nome: 'Kit Mordedor Resistente', categoria: 'brinquedos', preco: 49.90, desc: 'Brinquedo atóxico para entreter e fortalecer os dentes.' },
        { id: 3, nome: 'Shampoo Neutro Hipoalergênico', categoria: 'higiene', preco: 38.50, desc: 'Limpeza suave com extrato de aveia para peles sensíveis.' },
        { id: 4, nome: 'Ração Gatos Castrados 10kg', categoria: 'racao', preco: 154.00, desc: 'Fórmula balanceada para controle de peso e trato urinário.' }
    ];

    let imagensApi = [];
    try {
        const res = await fetch(API_ENDPOINTS.dogImages);
        const data = await res.json();
        imagensApi = data.message || [];
    } catch (e) {
        imagensApi = [];
    }

    const produtos = catalogoBase.map((item, idx) => ({
        ...item,
        imagem: imagensApi[idx] || 'https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg'
    }));

    function renderizar(categoriaFiltro) {
        const filtrados = categoriaFiltro === 'todos'
            ? produtos
            : produtos.filter(p => p.categoria === categoriaFiltro);

        lista.innerHTML = filtrados.map(prod => `
            <div class="card">
                <img src="${prod.imagem}" alt="${prod.nome}">
                <h3>${prod.nome}</h3>
                <p>${prod.desc}</p>
                <span class="price">R$ ${prod.preco.toFixed(2).replace('.', ',')}</span>
                <button class="btn-add-cart" data-id="${prod.id}">Adicionar ao Carrinho</button>
            </div>
        `).join('');

        lista.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const selecionado = produtos.find(p => p.id === id);
                if (selecionado) {
                    const carrinho = obterCarrinho();
                    carrinho.push(selecionado);
                    salvarCarrinho(carrinho);
                    renderizarCarrinho();
                    mostrarToast(`${selecionado.nome} adicionado ao carrinho!`);
                }
            });
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizar(btn.getAttribute('data-category'));
        });
    });

    renderizar('todos');
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const container = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total');
    if (!container || !totalEl) return;

    const itens = obterCarrinho();
    if (itens.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalEl.textContent = 'Total: R$ 0,00';
        return;
    }

    let soma = 0;
    container.innerHTML = itens.map((item, index) => {
        soma += item.preco;
        return `
            <div class="carrinho-item">
                <span><strong>${item.nome}</strong> - R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
                <button class="btn-remove-item" data-index="${index}">Remover</button>
            </div>
        `;
    }).join('');

    totalEl.textContent = `Total: R$ ${soma.toFixed(2).replace('.', ',')}`;

    container.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-index'));
            const atual = obterCarrinho();
            atual.splice(idx, 1);
            salvarCarrinho(atual);
            renderizarCarrinho();
        });
    });
}

function configurarFinalizarPedido() {
    const btn = document.getElementById('finalizar-pedido-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const itens = obterCarrinho();
        if (itens.length === 0) {
            mostrarToast('Adicione produtos ao carrinho primeiro.');
            return;
        }

        try {
            await fetch(API_ENDPOINTS.postsApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pedido: itens, data: new Date().toISOString() })
            });
            salvarCarrinho([]);
            renderizarCarrinho();
            mostrarToast('Pedido enviado com sucesso via API!');
        } catch (e) {
            mostrarToast('Erro ao enviar pedido.');
        }
    });
}

async function configurarServicosApi() {
    const racaSelect = document.getElementById('raca-select');
    const form = document.getElementById('form-agendamento');
    if (!racaSelect || !form) return;

    try {
        const res = await fetch(API_ENDPOINTS.dogBreeds);
        const data = await res.json();
        const racas = Object.keys(data.message);
        racaSelect.innerHTML = '<option value="SRD (Sem Raça Definida)">SRD (Sem Raça Definida)</option>' +
            racas.map(r => `<option value="${r}">${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('');
    } catch (e) {
        racaSelect.innerHTML = '<option value="SRD">SRD (Sem Raça Definida)</option>';
    }

    document.querySelectorAll('.btn-select-service').forEach(btn => {
        btn.addEventListener('click', () => {
            const servico = btn.getAttribute('data-service');
            const select = document.getElementById('servico-select');
            if (select) select.value = servico;
            document.getElementById('agendamento-box').scrollIntoView({ behavior: 'smooth' });
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const agendamento = {
            servico: document.getElementById('servico-select').value,
            raca: racaSelect.value,
            pet: document.getElementById('pet-nome').value,
            tutor: document.getElementById('tutor-nome').value,
            data: document.getElementById('agendamento-data').value,
            hora: document.getElementById('agendamento-hora').value
        };

        try {
            await fetch(API_ENDPOINTS.postsApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agendamento)
            });

            const salvos = JSON.parse(localStorage.getItem('kaio_pet_agendamentos')) || [];
            salvos.push(agendamento);
            localStorage.setItem('kaio_pet_agendamentos', JSON.stringify(salvos));
            renderizarAgendamentos();
            form.reset();
            mostrarToast('Agendamento confirmado com sucesso!');
        } catch (err) {
            mostrarToast('Erro ao registrar agendamento.');
        }
    });

    renderizarAgendamentos();
}

function renderizarAgendamentos() {
    const lista = document.getElementById('agendamentos-lista');
    if (!lista) return;
    const salvos = JSON.parse(localStorage.getItem('kaio_pet_agendamentos')) || [];
    lista.innerHTML = salvos.map(a => `
        <div class="agendamento-item">
            <strong>${a.servico}</strong> - Pet: ${a.pet} (${a.raca}) | Data: ${a.data} às ${a.hora}
        </div>
    `).join('');
}

function configurarContatoApi() {
    const cepInput = document.getElementById('contato-cep');
    const enderecoInput = document.getElementById('contato-endereco');
    const form = document.getElementById('form-contato');
    if (!form) return;

    if (cepInput && enderecoInput) {
        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    const res = await fetch(`${API_ENDPOINTS.viaCep}${cep}/json/`);
                    const data = await res.json();
                    if (!data.erro) {
                        enderecoInput.value = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
                        mostrarToast('Endereço encontrado pelo CEP!');
                    } else {
                        mostrarToast('CEP não encontrado.');
                    }
                } catch (e) {
                    mostrarToast('Erro ao consultar ViaCEP.');
                }
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nome: document.getElementById('contato-nome').value,
            email: document.getElementById('contato-email').value,
            cep: cepInput ? cepInput.value : '',
            endereco: enderecoInput ? enderecoInput.value : '',
            mensagem: document.getElementById('contato-msg').value
        };

        try {
            await fetch(API_ENDPOINTS.postsApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            form.reset();
            mostrarToast('Mensagem enviada com sucesso!');
        } catch (err) {
            mostrarToast('Erro ao enviar mensagem.');
        }
    });
}

function configurarAutenticacaoApi() {
    const form = document.getElementById('form-auth');
    if (!form) return;

    let modo = 'login';
    const tabLogin = document.getElementById('tab-login');
    const tabCadastro = document.getElementById('tab-cadastro');
    const grupoNome = document.getElementById('grupo-nome');
    const submitBtn = document.getElementById('auth-submit-btn');
    const logadoBox = document.getElementById('usuario-logado-box');
    const logadoTexto = document.getElementById('usuario-logado-texto');
    const btnSair = document.getElementById('btn-sair');

    function checarSessao() {
        const usuario = JSON.parse(localStorage.getItem('kaio_pet_usuario'));
        if (usuario) {
            form.style.display = 'none';
            document.querySelector('.auth-tabs').style.display = 'none';
            logadoBox.style.display = 'block';
            logadoTexto.textContent = `Conectado como ${usuario.nome} (${usuario.email})`;
        } else {
            form.style.display = 'flex';
            document.querySelector('.auth-tabs').style.display = 'flex';
            logadoBox.style.display = 'none';
        }
    }

    tabLogin.addEventListener('click', () => {
        modo = 'login';
        tabLogin.classList.add('active');
        tabCadastro.classList.remove('active');
        grupoNome.style.display = 'none';
        submitBtn.textContent = 'Entrar';
    });

    tabCadastro.addEventListener('click', () => {
        modo = 'cadastro';
        tabCadastro.classList.add('active');
        tabLogin.classList.remove('active');
        grupoNome.style.display = 'block';
        submitBtn.textContent = 'Cadastrar';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const nomeInput = document.getElementById('auth-nome').value;
        const nome = (modo === 'cadastro' && nomeInput.trim()) ? nomeInput.trim() : email.split('@')[0];

        try {
            await fetch(API_ENDPOINTS.postsApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, modo })
            });

            localStorage.setItem('kaio_pet_usuario', JSON.stringify({ nome, email }));
            atualizarHeaderAuth();
            checarSessao();
            mostrarToast(`Bem-vindo, ${nome}!`);
        } catch (err) {
            mostrarToast('Erro ao autenticar.');
        }
    });

    btnSair.addEventListener('click', () => {
        localStorage.removeItem('kaio_pet_usuario');
        atualizarHeaderAuth();
        checarSessao();
        mostrarToast('Você saiu da sua conta.');
    });

    checarSessao();
}

document.addEventListener('DOMContentLoaded', () => {
    configurarMenuMobile();
    atualizarBadgeCarrinho();
    atualizarHeaderAuth();
    carregarGaleriaSobreApi();
    carregarProdutosApi();
    configurarFinalizarPedido();
    configurarServicosApi();
    configurarContatoApi();
    configurarAutenticacaoApi();
});
