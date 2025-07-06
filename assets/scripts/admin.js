// Admin JS - CRUD de imóveis 100% frontend (localStorage) com emojis e feedback

const API_URL = 'https://luana-almeida.onrender.com';
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
    document.getElementById('codigo').value = '';
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
            ${(imovel.imagem && imovel.imagem !== 'null' && imovel.imagem !== 'undefined' && imovel.imagem !== '') ? `<img src="${imovel.imagem}" alt="Fachada" style="max-width:120px;max-height:90px;object-fit:cover;background:#f4f4f4;border-radius:8px;">` : '<div style="color:#aaa;font-size:12px;">Sem imagem</div>'}
        </div>
        <h3>🏠 ${imovel.titulo}</h3>
        <p>${imovel.descricao}</p>
        <p><b>💰 Preço:</b> ${formatarPreco(imovel.preco)}</p>
        <p><b>🏠 Tipo:</b> ${imovel.tipo}</p>
        <p><b>🛏️ Quartos:</b> ${imovel.quartos}</p>
        <p><b>🛋️ Salas:</b> ${imovel.salas}</p>
        <p><b>🚿 Banheiros:</b> ${imovel.banheiros}</p>
        <p><b>📐 Área Total:</b> ${imovel.area_total ? formatarArea(imovel.area_total) : '-'}</p>
        <p><b>🏢 Área Construída:</b> ${imovel.area_construida ? formatarArea(imovel.area_construida) : '-'}</p>
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
    // Remover todos os inputs 'codigo' duplicados, mantendo só um (garantia extra)
    const codigos = form.querySelectorAll('input[name="codigo"]');
    if (codigos.length > 1) {
        for (let i = codigos.length - 1; i > 0; i--) {
            codigos[i].parentNode.removeChild(codigos[i]);
        }
    }
    const formData = new FormData(form);
    // Garantir que area_total e area_construida sejam enviados como número
    if (form.area_total && form.area_total.value) {
        formData.set('area_total', String(Number(form.area_total.value)));
    }
    if (form.area_construida && form.area_construida.value) {
        formData.set('area_construida', String(Number(form.area_construida.value)));
    }
    // Validação para imagem obrigatória
    const fotosInput = document.getElementById('fotos-imovel');
    if (!fotosInput.files || fotosInput.files.length === 0) {
        alert('Selecione pelo menos uma imagem do imóvel!');
        fotosInput.focus();
        return;
    }
    // Geração de código único se não estiver editando
    let codigoInput = document.getElementById('codigo');
    if (!codigoInput.value) {
        codigoInput.value = 'IMV' + Date.now();
    }
    // Sempre garanta que só tem UM campo 'codigo' no formData
    formData.delete('codigo'); // remove todos antes
    formData.set('codigo', codigoInput.value);
    // Validação dos campos obrigatórios
    const camposObrigatorios = [
        'titulo', 'descricao', 'preco', 'quartos', 'salas', 'area_total', 'area_construida', 'localizacao', 'tipo', 'banheiros'
    ];
    for (const campo of camposObrigatorios) {
        if (!form[campo].value || form[campo].value.trim() === '') {
            alert('Por favor, preencha o campo obrigatório: ' + campo.charAt(0).toUpperCase() + campo.slice(1));
            form[campo].focus();
            return;
        }
    }
    if (isNaN(Number(form.area_total.value)) || Number(form.area_total.value) <= 0) {
        alert('Informe uma Área Total válida e maior que zero.');
        form.area_total.focus();
        return;
    }
    if (isNaN(Number(form.area_construida.value)) || Number(form.area_construida.value) <= 0) {
        alert('Informe uma Área Construída válida e maior que zero.');
        form.area_construida.focus();
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
    try {
        const res = await fetch(url, {
            method,
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            // Exibe a mensagem de erro detalhada do backend
            let msg = data && data.error ? data.error : 'Erro ao salvar imóvel';
            if (typeof msg !== 'string') msg = JSON.stringify(msg);
            mostrarFeedback(msg, '#dc3545');
            return;
        }
        mostrarFeedback('Imóvel salvo com sucesso!');
        animarConfirmacao('✅');
        limparForm();
        await carregarImoveis();
    } catch (err) {
        mostrarFeedback('Erro ao salvar imóvel: ' + err.message, '#dc3545');
    }
};

function editarImovel(imovel) {
    document.getElementById('imovel-id').value = imovel.id;
    form.dataset.editando = imovel.id;
    form.titulo.value = imovel.titulo;
    form.tipo.value = imovel.tipo;
    form.preco.value = imovel.preco;
    form.quartos.value = imovel.quartos;
    form.salas.value = imovel.salas;
    form.banheiros.value = imovel.banheiros;
    form.area_total.value = imovel.area_total || '';
    form.area_construida.value = imovel.area_construida || '';
    form.codigo.value = imovel.codigo || '';

    form.localizacao.value = imovel.localizacao;
    form.descricao.value = imovel.descricao;
    cancelarBtn.style.display = 'inline-block';
    previewFachada.innerHTML = (imovel.imagem && imovel.imagem !== 'null' && imovel.imagem !== 'undefined' && imovel.imagem !== '') ? `<img src="${imovel.imagem}" style="max-width:120px;max-height:90px;object-fit:cover;">` : '';
    // Preencher o previewCarrossel com as imagens do carrossel
    if (Array.isArray(imovel.carrossel) && imovel.carrossel.length > 0) {
        previewCarrossel.innerHTML = imovel.carrossel.map(img => `<img src="${img}" style="max-width:100px;max-height:75px;object-fit:cover;margin:3px;border-radius:6px;">`).join('');
    } else {
        previewCarrossel.innerHTML = '';
    }
}

cancelarBtn.onclick = () => {
    limparForm();
};

async function deletarImovel(id, card) {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    try {
        await fetch(`${API_URL}/imoveis/${id}`, { method: 'DELETE' });
        mostrarFeedback('Imóvel excluído com sucesso!');
        animarConfirmacao('🗑️');
        if (card && card.parentNode) card.parentNode.removeChild(card);
        await carregarImoveis();
    } catch (err) {
        mostrarFeedback('Erro ao excluir imóvel!', '#dc3545');
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
        // Sempre coloca a fachada como primeira
        if (fachadaIndex !== 0) {
            const dt = new DataTransfer();
            const fachada = files.splice(fachadaIndex, 1)[0];
            dt.items.add(fachada);
            files.forEach(f => dt.items.add(f));
            input.files = dt.files;
        }
    }
});
// Garante que ao editar, a fachada também seja a primeira
if (typeof atualizarPreviewImagens.fachadaIndex === 'undefined') atualizarPreviewImagens.fachadaIndex = 0;

// Limpar tudo
limparTudoBtn.onclick = async () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os imóveis?')) return;
    const res = await fetch(`${API_URL}/imoveis`);
    const imoveis = await res.json();
    for (const imovel of imoveis) {
        await fetch(`${API_URL}/imoveis/${imovel.id}`, { method: 'DELETE' });
    }
    mostrarFeedback('Todos os imóveis foram excluídos!');
    animarConfirmacao('🧹');
    await carregarImoveis();
};

// Busca rápida
buscaRapida.oninput = function() {
    filtroBusca = this.value;
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