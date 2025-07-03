// Admin JS - CRUD de imóveis 100% frontend (localStorage) com emojis e feedback

const API_URL = 'http://localhost:8080';
const UPLOAD = '/api/upload';

const form = document.getElementById('imovel-form');
const lista = document.getElementById('lista-imoveis');
const cancelarBtn = document.getElementById('cancelar-edicao');
const previewFachada = document.getElementById('preview-fachada');
const previewCarrossel = document.getElementById('preview-carrossel');
const contadorImoveis = document.getElementById('contador-imoveis');
const limparTudoBtn = document.getElementById('limpar-tudo');
const confirmacaoAnimada = document.getElementById('confirmacao-animada');
const buscaRapida = document.getElementById('busca-rapida');
const feedback = document.getElementById('mensagem-feedback');

let editandoId = null;
let filtroBusca = '';

// Proteção de acesso ao admin
if (!localStorage.getItem('admin_auth') || localStorage.getItem('admin_auth') !== 'true') {
    window.location.href = 'login.html';
}

// Botão de logout
function criarLogout() {
    const btn = document.createElement('button');
    btn.textContent = 'Sair';
    btn.style.position = 'fixed';
    btn.style.top = '18px';
    btn.style.right = '24px';
    btn.style.background = '#ff6b35';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '10px 22px';
    btn.style.borderRadius = '8px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    btn.onclick = function() {
        localStorage.removeItem('admin_auth');
        window.location.href = 'login.html';
    };
    document.body.appendChild(btn);
}
criarLogout();

function mostrarFeedback(msg, cor = '#28a745') {
    feedback.textContent = msg;
    feedback.style.display = 'block';
    feedback.style.background = cor;
    feedback.style.color = '#fff';
    feedback.style.textAlign = 'center';
    feedback.style.padding = '10px';
    feedback.style.margin = '10px auto 20px auto';
    feedback.style.borderRadius = '8px';
    feedback.style.maxWidth = '400px';
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 2000);
}

function animarConfirmacao(emoji) {
    confirmacaoAnimada.innerHTML = `<div style="font-size:3em;text-align:center;animation:pop 0.7s;">${emoji}</div>`;
    confirmacaoAnimada.style.display = 'block';
    setTimeout(() => {
        confirmacaoAnimada.style.display = 'none';
    }, 900);
}

function limparForm() {
    form.reset();
    document.getElementById('imovel-id').value = '';
    editandoId = null;
    cancelarBtn.style.display = 'none';
    previewFachada.innerHTML = '';
    previewCarrossel.innerHTML = '';
}

function atualizarContador(n) {
    contadorImoveis.innerHTML = `🏠 <span style="font-size:1.2em;animation:bounce 0.7s;display:inline-block;">${n}</span> imóvel${n === 1 ? '' : 'es'}`;
}

function formatarPreco(preco) {
    if (!preco || preco === 0) return '-';
    return 'R$ ' + Number(preco).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatarArea(area) {
    if (!area || area === 0) return '-';
    return Number(area).toLocaleString('pt-BR') + ' m²';
}

function criarCard(imovel) {
    const card = document.createElement('div');
    card.className = 'card fade-in';
    if (editandoId === imovel.id) card.classList.add('editando');
    card.innerHTML = `
        <div style="text-align:center;">
            <img src="${API_URL}/uploads/${imovel.imagem}" alt="Fachada" style="max-width:120px;max-height:90px;object-fit:cover;background:#f4f4f4;border-radius:8px;">
        </div>
        <h3>🏠 ${imovel.titulo}</h3>
        <p>${imovel.descricao}</p>
        <p><b>💰 Preço:</b> ${formatarPreco(imovel.preco)}</p>
        <p><b>🏠 Tipo:</b> ${imovel.tipo}</p>
        <p><b>🛏️ Quartos:</b> ${imovel.quartos}</p>
        <p><b>🛋️ Salas:</b> ${imovel.salas}</p>
        <p><b>🚿 Banheiros:</b> ${imovel.banheiros}</p>
        <p><b>📐 Área:</b> ${formatarArea(imovel.area)}</p>
        <p><b>📍 Localização:</b> ${imovel.localizacao}</p>
        <p><b>🔢 Código:</b> ${imovel.codigo || 'N/A'}</p>
        <p><b>👁️ Visitas:</b> ${imovel.visitas || 0}</p>
        <div class="card-actions">
            <button class="btn-edit">✏️ Editar</button>
            <button class="btn-delete">🗑️ Excluir</button>
        </div>
    `;
    card.querySelector('.btn-edit').onclick = () => editarImovel(imovel);
    card.querySelector('.btn-delete').onclick = () => deletarImovel(imovel.id, card);
    return card;
}

async function carregarImoveis() {
    const res = await fetch(`${API_URL}/imoveis`);
    const imoveis = await res.json();
    let listaFiltrada = imoveis;
    if (filtroBusca.trim()) {
        const termo = filtroBusca.trim().toLowerCase();
        listaFiltrada = imoveis.filter(imovel =>
            imovel.titulo.toLowerCase().includes(termo) ||
            imovel.localizacao.toLowerCase().includes(termo)
        );
    }
    lista.innerHTML = '';
    if (listaFiltrada.length === 0) {
        lista.innerHTML = '<div style="text-align:center;color:#888;font-size:1.1em;">Nenhum imóvel cadastrado ainda. 🏚️</div>';
    }
    listaFiltrada.forEach(imovel => {
        lista.appendChild(criarCard(imovel));
    });
    atualizarContador(imoveis.length);
}

async function uploadImagem(file) {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch(UPLOAD, { method: 'POST', body: data });
    const json = await res.json();
    return json.filepath;
}

form.onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Validação dos campos obrigatórios
    const camposObrigatorios = [
        'titulo', 'descricao', 'preco', 'quartos', 'salas', 'area', 'localizacao', 'tipo', 'banheiros'
    ];
    for (const campo of camposObrigatorios) {
        if (!form[campo].value || form[campo].value.trim() === '') {
            alert('Por favor, preencha o campo obrigatório: ' + campo.charAt(0).toUpperCase() + campo.slice(1));
            form[campo].focus();
            return;
        }
    }
    if (isNaN(Number(form.area.value)) || Number(form.area.value) <= 0) {
        alert('Informe uma área válida e maior que zero.');
        form.area.focus();
        return;
    }
    if (isNaN(Number(form.quartos.value)) || Number(form.quartos.value) < 0) {
        alert('Informe um número de quartos válido.');
        form.quartos.focus();
        return;
    }
    if (isNaN(Number(form.salas.value)) || Number(form.salas.value) < 0) {
        alert('Informe um número de salas válido.');
        form.salas.focus();
        return;
    }
    if (isNaN(Number(form.banheiros.value)) || Number(form.banheiros.value) < 0) {
        alert('Informe um número de banheiros válido.');
        form.banheiros.focus();
        return;
    }

    let method = 'POST';
    let url = `${API_URL}/imoveis`;
    if (form.dataset.editando) {
        method = 'PUT';
        url = `${API_URL}/imoveis/${form.dataset.editando}`;
    }

    await fetch(url, {
        method,
        body: formData
    });

    form.reset();
    form.removeAttribute('data-editando');
    document.getElementById('fotos-imovel').value = '';
    previewFachada.innerHTML = '';
    previewCarrossel.innerHTML = '';
    carregarImoveis();
};

function editarImovel(imovel) {
    const form = document.getElementById('imovel-form');
    form.titulo.value = imovel.titulo;
    form.descricao.value = imovel.descricao;
    form.preco.value = imovel.preco;
    form.quartos.value = imovel.quartos;
    form.salas.value = imovel.salas;
    form.area.value = imovel.area;
    form.localizacao.value = imovel.localizacao;
    editandoId = imovel.id;
    cancelarBtn.style.display = 'inline-block';
    mostrarFeedback('✏️ Editando imóvel...', '#ffc107');
    carregarImoveis();
}

cancelarBtn.onclick = () => {
    limparForm();
    mostrarFeedback('✏️ Edição cancelada.', '#6c757d');
    carregarImoveis();
};

function deletarImovel(id, card) {
    if (confirm('Tem certeza que deseja deletar este imóvel?')) {
        fetch(`${API_URL}/imoveis/${id}`, { method: 'DELETE' })
            .then(() => {
                if (card) {
                    card.classList.add('fade-out');
                    setTimeout(() => {
                        carregarImoveis();
                    }, 400);
                } else {
                    carregarImoveis();
                }
                limparForm();
                mostrarFeedback('🗑️ Imóvel deletado!', '#dc3545');
                animarConfirmacao('🗑️');
            });
    }
}

// Preview das imagens
function atualizarPreviewImagens() {
    previewFachada.innerHTML = '';
    previewCarrossel.innerHTML = '';
    const input = document.getElementById('fotos-imovel');
    let files = Array.from(input.files);
    if (files.length === 0) return;

    // Estado: índice da fachada
    let fachadaIndex = 0;
    if (typeof atualizarPreviewImagens.fachadaIndex === 'number') {
        fachadaIndex = atualizarPreviewImagens.fachadaIndex;
        if (fachadaIndex >= files.length) fachadaIndex = 0;
    }

    // Reordenar arquivos para garantir que a fachada seja a primeira
    if (fachadaIndex !== 0) {
        const fachada = files.splice(fachadaIndex, 1)[0];
        files.unshift(fachada);
        fachadaIndex = 0;
        atualizarPreviewImagens.fachadaIndex = 0;
    }

    // Renderizar todas as imagens como miniaturas clicáveis
    files.forEach((file, idx) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = idx === 0 ? '120px' : '70px';
        img.style.maxHeight = idx === 0 ? '90px' : '50px';
        img.style.margin = '4px';
        img.style.borderRadius = '8px';
        img.style.border = idx === 0 ? '3px solid #ff9900' : '2px solid #eee';
        img.style.cursor = 'pointer';
        img.title = idx === 0 ? 'Fachada' : 'Clique para definir como fachada';
        img.onclick = () => {
            atualizarPreviewImagens.fachadaIndex = idx;
            atualizarPreviewImagens();
        };
        if (idx === 0) {
            // Selo "Fachada"
            const selo = document.createElement('div');
            selo.innerText = 'Fachada';
            selo.style.position = 'absolute';
            selo.style.top = '2px';
            selo.style.left = '8px';
            selo.style.background = '#ff9900';
            selo.style.color = '#fff';
            selo.style.fontSize = '0.85em';
            selo.style.padding = '2px 8px';
            selo.style.borderRadius = '6px';
            selo.style.fontWeight = 'bold';
            selo.style.boxShadow = '0 2px 8px #0002';
            selo.style.pointerEvents = 'none';
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.appendChild(img);
            wrapper.appendChild(selo);
            previewFachada.appendChild(wrapper);
        } else {
            previewCarrossel.appendChild(img);
        }
    });

    // Atualizar fachadaIndex para o input
    input.fachadaIndex = 0;
}
document.getElementById('fotos-imovel').addEventListener('change', function() {
    atualizarPreviewImagens.fachadaIndex = 0;
    atualizarPreviewImagens();
});

// Ao enviar o formulário, reordene os arquivos para garantir que a fachada seja a primeira
form.addEventListener('submit', function(e) {
    const input = document.getElementById('fotos-imovel');
    if (input && input.files && input.files.length > 1) {
        let fachadaIndex = typeof atualizarPreviewImagens.fachadaIndex === 'number' ? atualizarPreviewImagens.fachadaIndex : 0;
        let files = Array.from(input.files);
        if (fachadaIndex >= files.length) fachadaIndex = 0;
        if (fachadaIndex !== 0) {
            const dt = new DataTransfer();
            const fachada = files.splice(fachadaIndex, 1)[0];
            dt.items.add(fachada);
            files.forEach(f => dt.items.add(f));
            input.files = dt.files;
        }
    }
});

// Limpar tudo
limparTudoBtn.onclick = () => {
    if (confirm('Tem certeza que deseja remover TODOS os imóveis?')) {
        fetch(`${API_URL}/imoveis`)
            .then(res => res.json())
            .then(imoveis => {
                Promise.all(imoveis.map(imovel => fetch(`${API_URL}/imoveis/${imovel.id}`, { method: 'DELETE' })))
                    .then(() => {
                        carregarImoveis();
                        limparForm();
                        mostrarFeedback('🧹 Todos os imóveis foram removidos!', '#dc3545');
                        animarConfirmacao('🧹');
                    });
            });
    }
};

// Busca rápida
buscaRapida.oninput = (e) => {
    filtroBusca = e.target.value;
    carregarImoveis();
};

// Animações CSS
const style = document.createElement('style');
style.innerHTML = `
@keyframes pop {0%{transform:scale(0.7);} 60%{transform:scale(1.2);} 100%{transform:scale(1);}}
@keyframes bounce {0%{transform:translateY(-10px);} 50%{transform:translateY(5px);} 100%{transform:translateY(0);}}
.fade-in{animation:fadeIn 0.5s;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.fade-out{animation:fadeOut 0.4s forwards;}
@keyframes fadeOut{to{opacity:0;transform:scale(0.95);}}
`;
document.head.appendChild(style);

carregarImoveis();

// Validação visual dos campos obrigatórios
form.addEventListener('submit', function(e) {
  let valido = true;
  form.querySelectorAll('[required]').forEach(campo => {
    if (!campo.value.trim()) {
      campo.style.border = '2px solid #ff9900';
      valido = false;
    } else {
      campo.style.border = '';
    }
  });
  if (!valido) {
    e.preventDefault();
    mostrarMensagem('Preencha todos os campos obrigatórios!', false);
    return false;
  }
  // Corrigir valor do preço para enviar só números (ex: 350000.00)
  const preco = document.getElementById('preco');
  if (preco) {
    let valor = preco.value.replace(/\./g, '').replace(',', '.').replace(/[^\d\.]/g, '');
    preco.value = valor;
  }
});

// Mensagem de feedback visual
function mostrarMensagem(msg, sucesso = true) {
  let div = document.getElementById('mensagem-feedback');
  if (!div) {
    div = document.createElement('div');
    div.id = 'mensagem-feedback';
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.zIndex = '9999';
    div.style.padding = '16px 24px';
    div.style.borderRadius = '8px';
    div.style.fontWeight = 'bold';
    div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    document.body.appendChild(div);
  }
  div.innerText = msg;
  div.style.background = sucesso ? '#4caf50' : '#ff9900';
  div.style.color = '#fff';
  div.style.display = 'block';
  setTimeout(() => { div.style.display = 'none'; }, 3000);
} 