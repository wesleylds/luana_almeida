const API_URL = 'https://luana-almeida-site.onrender.com';

function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function criarCarrosselNovo(imagens, imagemPrincipal) {
    const banner = document.getElementById('banner-carrossel');
    const thumbs = document.getElementById('miniaturas-carrossel');
    if (!banner || !thumbs) return;
    const todasImagens = [imagemPrincipal, ...imagens.filter(img => img !== imagemPrincipal)];
    let idxAtual = 0;

    function renderBanner(idx) {
        banner.innerHTML = `
            <img src="${API_URL}/uploads/${todasImagens[idx]}" alt="Imagem do imóvel">
            ${todasImagens.length > 1 ? `<button class='carrossel-seta esq' id='prev-img'>&#10094;</button><button class='carrossel-seta dir' id='next-img'>&#10095;</button>` : ''}
        `;
        if (todasImagens.length > 1) {
            document.getElementById('prev-img').onclick = () => {
                idxAtual = (idxAtual - 1 + todasImagens.length) % todasImagens.length;
                renderBanner(idxAtual);
                renderThumbs(idxAtual);
            };
            document.getElementById('next-img').onclick = () => {
                idxAtual = (idxAtual + 1) % todasImagens.length;
                renderBanner(idxAtual);
                renderThumbs(idxAtual);
            };
        }
    }
    function renderThumbs(idx) {
        thumbs.innerHTML = todasImagens.map((img, i) =>
            `<img src="${API_URL}/uploads/${img}" class="${i === idx ? 'ativa' : ''}" data-idx="${i}" alt="Miniatura">`
        ).join('');
        thumbs.querySelectorAll('img').forEach(img => {
            img.onclick = () => {
                idxAtual = Number(img.dataset.idx);
                renderBanner(idxAtual);
                renderThumbs(idxAtual);
            };
        });
    }
    renderBanner(idxAtual);
    renderThumbs(idxAtual);
}

function exibirDescricao(imovel) {
    const desc = document.getElementById('descricao-imovel');
    if (!desc) return;
    desc.innerHTML = `
        <div class="cabecalho-imovel">
            <div>
                <h2 class="titulo-imovel-destaque">${imovel.titulo}</h2>
                <span class="codigo-imovel-destaque">#${imovel.codigo ?? imovel.id}</span>
            </div>
            <div class="preco-imovel-destaque">R$ ${Number(imovel.preco).toLocaleString('pt-BR')}</div>
        </div>
        <div class="caracteristicas-imovel">
            <div><i class="fas fa-home"></i> <span>${imovel.tipo ?? '-'}</span></div>
            <div><i class="fas fa-bed"></i> ${imovel.quartos ?? '-'} Quartos</div>
            <div><i class="fas fa-couch"></i> ${imovel.salas ?? '-'} Salas</div>
            <div><i class="fas fa-ruler-combined"></i> ${imovel.area ?? '-'} m²</div>
            <div><i class="fas fa-bath"></i> ${imovel.banheiros ?? '-'} Banheiros</div>
            <div><i class="fas fa-map-marker-alt"></i> ${imovel.localizacao ?? '-'}</div>
        </div>
        <p class="descricao-imovel-destaque">${imovel.descricao}</p>
    `;
}

function exibirMapa(localizacao) {
    const mapa = document.getElementById('mapa-imovel');
    if (!mapa || !localizacao) return;
    const url = `https://www.google.com/maps?q=${encodeURIComponent(localizacao)}&output=embed`;
    mapa.innerHTML = `<iframe src="${url}" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function configurarContato(imovel) {
    const btn = document.querySelector('.btn-whatsapp');
    if (!btn) return;
    // Montar mensagem personalizada
    let msg = `Olá! Tenho interesse no imóvel ${imovel.titulo} (código: ${imovel.codigo ?? imovel.id}).\n`;
    msg += `\nCaracterísticas:`;
    msg += `\n• Tipo: ${imovel.tipo ?? '-'}`;
    msg += `\n• Quartos: ${imovel.quartos ?? '-'}`;
    msg += `\n• Salas: ${imovel.salas ?? '-'}`;
    msg += `\n• Área: ${imovel.area ?? '-'} m²`;
    msg += `\n• Banheiros: ${imovel.banheiros ?? '-'}`;
    msg += `\n• Localização: ${imovel.localizacao ?? '-'}`;
    msg += `\n• Preço: R$ ${Number(imovel.preco).toLocaleString('pt-BR')}`;
    btn.href = `https://wa.me/5516993394135?text=${encodeURIComponent(msg)}`;
}

async function carregarDetalhes() {
    const id = getIdFromUrl();
    if (!id) return;
    const res = await fetch(`${API_URL}/imoveis/${id}`);
    if (!res.ok) {
        alert('Imóvel não encontrado!');
        return;
    }
    const imovel = await res.json();
    criarCarrosselNovo(imovel.carrossel, imovel.imagem);
    exibirDescricao(imovel);
    exibirMapa(imovel.localizacao);
    configurarContato(imovel);
}

carregarDetalhes(); 