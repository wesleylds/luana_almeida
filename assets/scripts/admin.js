// -ww- Weslley Lemos de Sousa
// Admin JS - CRUD de imóveis 100% frontend (localStorage) com emojis e feedback

const API_URL = 'https://luana-almeida.onrender.com';
const ADMIN_TOKEN = 'luanaadmin2024!'; // Substitua pelo valor real do seu ADMIN_TOKEN
const UPLOAD = '/api/upload';
const BASE_URL = "https://luana-almeida.onrender.com/uploads/";

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

// -ww- Weslley Lemos de Sousa
// Ativar modo escuro automático
if (!document.body.classList.contains('dark')) {
    document.body.classList.add('dark');
}

// -ww- Weslley Lemos de Sousa
// Alternância do botão de modo escuro
const toggleDark = document.getElementById('toggle-dark');
const iconDark = document.getElementById('icon-dark');
if (toggleDark && iconDark) {
    function atualizarIconeModo() {
        if (document.body.classList.contains('dark')) {
            iconDark.textContent = '☀️';
        } else {
            iconDark.textContent = '🌙';
        }
    }
    toggleDark.onclick = function() {
        document.body.classList.toggle('dark');
        atualizarIconeModo();
    };
    atualizarIconeModo();
}
// -ww- Weslley Lemos de Sousa
// Proteção de acesso ao admin
if (!localStorage.getItem('admin_auth') || localStorage.getItem('admin_auth') !== 'true') {
    window.location.href = 'login.html';
}



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
            ${(imovel.imagem && imovel.imagem !== 'null' && imovel.imagem !== 'undefined' && imovel.imagem !== '') ? `<img src="${imovel.imagem.startsWith('http') ? imovel.imagem : BASE_URL + imovel.imagem}" alt="Fachada" style="max-width:120px;max-height:90px;object-fit:cover;background:#f4f4f4;border-radius:8px;">` : '<div style="color:#aaa;font-size:12px;">Sem imagem</div>'}
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
    // -ww- Weslley Lemos de Sousa
// Remover todos os inputs 'codigo' duplicados, mantendo só um (garantia extra)
    const codigos = form.querySelectorAll('input[name="codigo"]');
    if (codigos.length > 1) {
        for (let i = codigos.length - 1; i > 0; i--) {
            codigos[i].parentNode.removeChild(codigos[i]);
        }
    }
    const formData = new FormData(form);
    // -ww- Weslley Lemos de Sousa
// Garantir que area_total e area_construida sejam enviados como número
    if (form.area_total && form.area_total.value) {
        formData.set('area_total', String(Number(form.area_total.value)));
    }
    if (form.area_construida && form.area_construida.value) {
        formData.set('area_construida', String(Number(form.area_construida.value)));
    }
    // -ww- Weslley Lemos de Sousa
// Geração de código único se não estiver editando
    let codigoInput = document.getElementById('codigo');
    if (!codigoInput.value) {
        codigoInput.value = 'IMV' + Date.now();
    }
    // -ww- Weslley Lemos de Sousa
// Sempre garanta que só tem UM campo 'codigo' no formData
    formData.delete('codigo'); // -ww- Weslley Lemos de Sousa
// remove todos antes
    formData.set('codigo', codigoInput.value);
    // -ww- Weslley Lemos de Sousa
// Validação dos campos obrigatórios
    const camposObrigatorios = [
        'titulo', 'descricao', 'preco', 'quartos', 'salas', 'localizacao', 'tipo', 'banheiros'
    ];
    for (const campo of camposObrigatorios) {
        if (!form[campo].value || form[campo].value.trim() === '') {
            alert('Por favor, preencha o campo obrigatório: ' + campo.charAt(0).toUpperCase() + campo.slice(1));
            form[campo].focus();
            return;
        }
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
            body: formData,
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });
        const data = await res.json();
        if (!res.ok) {
            // -ww- Weslley Lemos de Sousa
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

    // -ww- Weslley Lemos de Sousa
// Limpa previews antigos
    previewFachada.innerHTML = '';
    previewCarrossel.innerHTML = '';

    // -ww- Weslley Lemos de Sousa
// Guarda as imagens existentes em inputs hidden
    const oldImagesContainer = document.createElement('div');
    oldImagesContainer.id = 'old-images';
    form.appendChild(oldImagesContainer);

    // -ww- Weslley Lemos de Sousa
// Exibir a fachada (imagem principal)
    if (imovel.imagem && imovel.imagem !== 'null' && imovel.imagem !== 'undefined' && imovel.imagem !== '') {
        const imgElement = document.createElement('img');
        imgElement.src = imovel.imagem.startsWith('http') ? imovel.imagem : `${BASE_URL}${imovel.imagem}`;
        imgElement.style.maxWidth = '120px';
        imgElement.style.maxHeight = '90px';
        imgElement.style.objectFit = 'cover';
        previewFachada.appendChild(imgElement);

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'imagem_existente';
        hiddenInput.value = imovel.imagem;
        oldImagesContainer.appendChild(hiddenInput);
    }

    // -ww- Weslley Lemos de Sousa
// Exibir as demais imagens do carrossel
    if (Array.isArray(imovel.carrossel) && imovel.carrossel.length > 0) {
        imovel.carrossel.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.src = img.startsWith('http') ? img : `${BASE_URL}${img}`;
            imgElement.style.maxWidth = '100px';
            imgElement.style.maxHeight = '75px';
            imgElement.style.objectFit = 'cover';
            imgElement.style.margin = '3px';
            imgElement.style.borderRadius = '6px';
            previewCarrossel.appendChild(imgElement);

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'carrossel_existente[]';
            hiddenInput.value = img;
            oldImagesContainer.appendChild(hiddenInput);
        });
    } 

    window.scrollTo(0, 0);
}

cancelarBtn.onclick = () => {
    limparForm();
};

async function deletarImovel(id, card) {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    try {
        await fetch(`${API_URL}/imoveis/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });
        mostrarFeedback('Imóvel excluído com sucesso!');
        animarConfirmacao('🗑️');
        if (card && card.parentNode) card.parentNode.removeChild(card);
        await carregarImoveis();
    } catch (err) {
        mostrarFeedback('Erro ao excluir imóvel!', '#dc3545');
    }
}

// -ww- Weslley Lemos de Sousa
// Preview das imagens
function atualizarPreviewImagens() {
    previewFachada.innerHTML = '';
    previewCarrossel.innerHTML = '';
    const input = document.getElementById('fotos-imovel');
    let files = Array.from(input.files);
    if (files.length === 0) return;

    // -ww- Weslley Lemos de Sousa
// Estado: índice da fachada
    let fachadaIndex = 0;
    if (typeof atualizarPreviewImagens.fachadaIndex === 'number') {
        fachadaIndex = atualizarPreviewImagens.fachadaIndex;
        if (fachadaIndex >= files.length) fachadaIndex = 0;
    }

    // -ww- Weslley Lemos de Sousa
// Reordenar arquivos para garantir que a fachada seja a primeira
    if (fachadaIndex !== 0) {
        const fachada = files.splice(fachadaIndex, 1)[0];
        files.unshift(fachada);
        fachadaIndex = 0;
        atualizarPreviewImagens.fachadaIndex = 0;
    }

    // -ww- Weslley Lemos de Sousa
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
            // -ww- Weslley Lemos de Sousa
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

    // -ww- Weslley Lemos de Sousa
// Atualizar fachadaIndex para o input
    input.fachadaIndex = 0;
}
document.getElementById('fotos-imovel').addEventListener('change', function() {
    atualizarPreviewImagens.fachadaIndex = 0;
    atualizarPreviewImagens();
});

// -ww- Weslley Lemos de Sousa
// Ao enviar o formulário, reordene os arquivos para garantir que a fachada seja a primeira
form.addEventListener('submit', function(e) {
    const input = document.getElementById('fotos-imovel');
    if (input && input.files && input.files.length > 1) {
        let fachadaIndex = typeof atualizarPreviewImagens.fachadaIndex === 'number' ? atualizarPreviewImagens.fachadaIndex : 0;
        let files = Array.from(input.files);
        if (fachadaIndex >= files.length) fachadaIndex = 0;
        // -ww- Weslley Lemos de Sousa
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
// -ww- Weslley Lemos de Sousa
// Garante que ao editar, a fachada também seja a primeira
if (typeof atualizarPreviewImagens.fachadaIndex === 'undefined') atualizarPreviewImagens.fachadaIndex = 0;

// -ww- Weslley Lemos de Sousa
// Limpar tudo
limparTudoBtn.onclick = async () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os imóveis?')) return;
    const res = await fetch(`${API_URL}/imoveis`);
    const imoveis = await res.json();
    for (const imovel of imoveis) {
        await fetch(`${API_URL}/imoveis/${imovel.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });
    }
    mostrarFeedback('Todos os imóveis foram excluídos!');
    animarConfirmacao('🧹');
    await carregarImoveis();
};

// -ww- Weslley Lemos de Sousa
// Busca rápida
buscaRapida.oninput = function() {
    filtroBusca = this.value;
    carregarImoveis();
};

// -ww- Weslley Lemos de Sousa
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

// -ww- Weslley Lemos de Sousa
// Validação visual dos campos obrigatórios
form.addEventListener('submit', function(e) {
  let valido = true;
  form.querySelectorAll('[required]').forEach(campo => {
    // -ww- Weslley Lemos de Sousa
// Ignora area_total e area_construida mesmo que estejam marcados como required
    if (campo.id === 'area_total' || campo.id === 'area_construida') return;
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
  // -ww- Weslley Lemos de Sousa
// Corrigir valor do preço para enviar só números (ex: 350000.00)
  const preco = document.getElementById('preco');
  if (preco) {
    let valor = preco.value.replace(/\./g, '').replace(',', '.').replace(/[^\d\.]/g, '');
    preco.value = valor;
  }
});

// -ww- Weslley Lemos de Sousa
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