const API_URL = 'https://luana-almeida.onrender.com';

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

    // Montar HTML das imagens para o Slick
    banner.innerHTML = `<div class="carrossel-imagens">${todasImagens.map(img => `<img src='https://luana-almeida.onrender.com/uploads/${img}' class='img-carrossel' style='max-width:100%;border-radius:8px;'>`).join('')}</div>`;

    // Inicializar Slick Carousel premium
    $(function() {
      $('.carrossel-imagens').slick({
        dots: false,
        arrows: false,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
        speed: 600,
        cssEase: 'cubic-bezier(0.77, 0, 0.175, 1)'
      });
      // Sincronizar miniaturas com slide
      $('.carrossel-imagens').on('afterChange', function(event, slick, currentSlide){
        thumbs.querySelectorAll('img').forEach(t => t.classList.remove('ativa'));
        if (thumbs.querySelectorAll('img')[currentSlide]) {
          thumbs.querySelectorAll('img')[currentSlide].classList.add('ativa');
        }
      });
    });

    // Miniaturas premium
    thumbs.innerHTML = todasImagens.map((img, i) =>
        `<img src="https://luana-almeida.onrender.com/uploads/${img}" class="${i === idxAtual ? 'ativa' : ''}" data-idx="${i}" alt="Miniatura" style="width:70px;height:70px;object-fit:cover;border-radius:8px;margin:0 4px;cursor:pointer;">`
    ).join('');
    thumbs.querySelectorAll('img').forEach(img => {
        img.onclick = () => {
            $('.carrossel-imagens').slick('slickGoTo', Number(img.dataset.idx));
            thumbs.querySelectorAll('img').forEach(t => t.classList.remove('ativa'));
            img.classList.add('ativa');
        };
    });
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
            <div><i class="fas fa-ruler-combined"></i> ${imovel.area_total ? imovel.area_total + ' m²' : '-'} (Total)</div>
            <div><i class="fas fa-building"></i> ${imovel.area_construida ? imovel.area_construida + ' m²' : '-'} (Construída)</div>
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
    msg += `\n• Área Total: ${imovel.area_total ? imovel.area_total + ' m²' : '-'}`;
    msg += `\n• Área Construída: ${imovel.area_construida ? imovel.area_construida + ' m²' : '-'}`;
    msg += `\n• Banheiros: ${imovel.banheiros ?? '-'}`;
    msg += `\n• Localização: ${imovel.localizacao ?? '-'}`;
    msg += `\n• Preço: R$ ${Number(imovel.preco).toLocaleString('pt-BR')}`;
    btn.href = `https://wa.me/5516993394135?text=${encodeURIComponent(msg)}`;
}

// Função para carregar os detalhes do imóvel
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

document.addEventListener('DOMContentLoaded', carregarDetalhes);