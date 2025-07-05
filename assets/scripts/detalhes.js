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
    banner.innerHTML = `<div class="carrossel-imagens">${todasImagens.map((img, idx) => `<img src='https://luana-almeida.onrender.com/uploads/${img}' class='img-carrossel' style='max-width:100%;border-radius:8px;cursor:pointer;' data-idx='${idx}'>`).join('')}</div>`;

    // Inicializar Slick Carousel igual ao index
    $(function() {
      $('.carrossel-imagens').slick({
        dots: false,
        arrows: true,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: false,
        speed: 500,
        cssEase: 'ease'
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

    // Modal fullscreen premium ao clicar na imagem principal
    document.querySelectorAll('.img-carrossel').forEach(img => {
      img.onclick = (e) => {
        const startIdx = Number(img.dataset.idx);
        abrirModalFullscreenPremium(todasImagens, startIdx);
      };
    });
}

// Modal fullscreen premium
function abrirModalFullscreenPremium(imagens, startIdx) {
  let idx = startIdx;
  const modal = document.createElement('div');
  modal.id = 'modal-fullscreen-premium';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.92)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '99999';
  modal.innerHTML = `
    <span id='close-modal-premium' style='position:fixed;top:24px;right:40px;font-size:2.5em;color:#fff;cursor:pointer;font-weight:bold;z-index:10000;'>&times;</span>
    <div style='flex:1;display:flex;align-items:center;justify-content:center;width:100vw;'>
      <button id='modal-prev-img-premium' style='background:none;border:none;color:#fff;font-size:3em;cursor:pointer;position:absolute;left:32px;top:50%;transform:translateY(-50%);z-index:10001;'>&#10094;</button>
      <img src='https://luana-almeida.onrender.com/uploads/${imagens[idx]}' id='modal-img-premium' style='max-width:80vw;max-height:80vh;display:block;margin:auto;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.25);transition:opacity 0.4s;'>
      <button id='modal-next-img-premium' style='background:none;border:none;color:#fff;font-size:3em;cursor:pointer;position:absolute;right:32px;top:50%;transform:translateY(-50%);z-index:10001;'>&#10095;</button>
    </div>
    <div id='modal-thumbs-premium' style='display:flex;justify-content:center;gap:10px;margin:18px 0 0 0;'>
      ${imagens.map((img, i) => `<img src='https://luana-almeida.onrender.com/uploads/${img}' data-idx='${i}' class='modal-thumb-premium${i===idx?' ativa':''}' style='width:70px;height:70px;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.10);opacity:${i===idx?1:0.7};border:2px solid ${i===idx?'#ff9900':'transparent'};cursor:pointer;transition:border 0.3s,opacity 0.3s;'>`).join('')}
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('close-modal-premium').onclick = () => modal.remove();
  document.getElementById('modal-prev-img-premium').onclick = (e) => {
    e.stopPropagation();
    idx = (idx - 1 + imagens.length) % imagens.length;
    atualizarModalPremium(modal, imagens, idx);
  };
  document.getElementById('modal-next-img-premium').onclick = (e) => {
    e.stopPropagation();
    idx = (idx + 1) % imagens.length;
    atualizarModalPremium(modal, imagens, idx);
  };
  modal.querySelectorAll('.modal-thumb-premium').forEach(img => {
    img.onclick = () => {
      idx = Number(img.dataset.idx);
      atualizarModalPremium(modal, imagens, idx);
    };
  });
  modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

function atualizarModalPremium(modal, imagens, idx) {
  const img = modal.querySelector('#modal-img-premium');
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = `https://luana-almeida.onrender.com/uploads/${imagens[idx]}`;
    img.style.opacity = 1;
    // Atualizar miniaturas
    modal.querySelectorAll('.modal-thumb-premium').forEach((thumb, i) => {
      thumb.classList.toggle('ativa', i === idx);
      thumb.style.opacity = i === idx ? 1 : 0.7;
      thumb.style.border = i === idx ? '2px solid #ff9900' : '2px solid transparent';
    });
  }, 200);
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