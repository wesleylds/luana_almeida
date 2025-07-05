document.addEventListener('DOMContentLoaded', function () {
  // Carregar imóveis na página imoveis.html
  if (window.location.pathname.endsWith('imoveis.html')) {
    carregarImoveisPublico();
  }

  // Inicializar carrosséis se existirem
  inicializarCarrosseis();
});

async function carregarImoveisPublico() {
  const API_URL = 'https://luana-almeida.onrender.com';
  const lista = document.getElementById('lista-imoveis');
  if (!lista) return;
  
  lista.innerHTML = '<div style="color:#888;text-align:center;">Carregando imóveis...</div>';
  
  try {
    const res = await fetch(`${API_URL}/imoveis`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const imoveis = await res.json();
    
    if (!Array.isArray(imoveis) || imoveis.length === 0) {
      lista.innerHTML = '<div style="color:#888;text-align:center;">Nenhum imóvel cadastrado ainda.</div>';
      return;
    }
    
    lista.innerHTML = imoveis.map(imovel => {
      let descricao = imovel.descricao || '';
      if (descricao.length > 180) {
        descricao = descricao.substring(0, 180) + '...';
      }
      return `
      <div class="imovel-card">
        <div class="imovel-card-imgbox">
          <img src="https://luana-almeida.onrender.com/uploads/${imovel.imagem}" alt="${imovel.titulo}" data-id="${imovel.id}" class="imovel-img-click" onerror="this.src='assets/images/exemplo-sala-estar.jpg'">
          <div class="imovel-card-overlay">
            <div class="imovel-card-preco">R$ ${Number(imovel.preco).toLocaleString('pt-BR')}</div>
            <div class="imovel-card-local"><i class="fa-solid fa-map-marker-alt"></i> ${imovel.localizacao || '-'}</div>
          </div>
        </div>
        <div class="imovel-card-titulo imovel-titulo-click" data-id="${imovel.id}">${imovel.titulo}</div>
        <div class="imovel-card-detalhes">
          <div class="imovel-card-detalhe"><i class="fa-solid fa-home"></i> ${imovel.tipo || '-'}</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-bed"></i> ${imovel.quartos ?? '-'} Quartos</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-couch"></i> ${imovel.salas ?? '-'} Salas</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-bath"></i> ${imovel.banheiros ?? '-'} Banheiros</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-ruler-combined"></i> ${imovel.area_total ? imovel.area_total + ' m²' : '-'}</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-building"></i> ${imovel.area_construida ? imovel.area_construida + ' m²' : '-'}</div>
          <div class="imovel-card-detalhe"><i class="fa-solid fa-hashtag"></i> IMV${imovel.codigo || '-'}</div>
        </div>
        <div class="imovel-descricao-simples" style="margin: 14px 18px 0 18px; color:#3b4a6b; font-size:1em;">${descricao}</div>
        <div class="imovel-card-footer">
          <a href="detalhes.html?id=${imovel.id}" class="btn-detalhes">Ver Detalhes</a>
        </div>
      </div>
      `;
    }).join('');

    // Adicionar evento de clique para imagem e título
    document.querySelectorAll('.imovel-img-click').forEach(img => {
      img.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (id) window.location.href = `detalhes.html?id=${id}`;
      });
    });
    document.querySelectorAll('.imovel-titulo-click').forEach(titulo => {
      titulo.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (id) window.location.href = `detalhes.html?id=${id}`;
      });
    });
  } catch (e) {
    console.error('Erro ao carregar imóveis:', e);
    lista.innerHTML = '<div style="color:#d00;text-align:center;">Erro ao carregar imóveis. Verifique se o servidor está rodando.</div>';
  }
}

function inicializarCarrosseis() {
  // Verificar se o jQuery e Slick estão carregados
  if (typeof $ === 'undefined' || typeof $.fn.slick === 'undefined') {
    console.log('jQuery ou Slick não estão carregados');
    return;
  }

  // Inicializando o Carrossel Slick para Imóveis em Destaque
  if ($('.destaque-carrossel').length) {
    $('.destaque-carrossel').slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
            infinite: true
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });
  }

  // Inicializando o Carrossel Slick para Novos Imóveis
  if ($('.novos-imoveis-carrossel').length) {
    $('.novos-imoveis-carrossel').slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
            infinite: true
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });
  }

  // Inicializando o Carrossel Slick para Detalhes do Imóvel
  if ($('.detalhes-carrossel').length) {
    $('.detalhes-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para o Banner
  if ($('.banner-carrossel').length) {
    $('.banner-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para Sobre
  if ($('.sobre-carrossel').length) {
    $('.sobre-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para Lista de Novos Imóveis
  if ($('.imoveis-lista.novos').length) {
    $('.imoveis-lista.novos').slick({
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 4,
      slidesToScroll: 1,
      arrows: true,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 1
          }
        }
      ]
    });
  }
}

// Função de debounce para otimizar buscas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Função para remover acentos
function removerAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Função de busca de imóveis
function buscarImoveis() {
  const termo = document.getElementById('busca-input').value.toLowerCase();
  const cards = document.querySelectorAll('.imovel-card');
  
  cards.forEach(card => {
    const titulo = card.querySelector('h3').textContent.toLowerCase();
    const localizacao = card.querySelector('p:last-child').textContent.toLowerCase();
    const tituloSemAcentos = removerAcentos(titulo);
    const localizacaoSemAcentos = removerAcentos(localizacao);
    const termoSemAcentos = removerAcentos(termo);
    
    if (titulo.includes(termo) || localizacao.includes(termo) || 
        tituloSemAcentos.includes(termoSemAcentos) || localizacaoSemAcentos.includes(termoSemAcentos)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Aplicar filtros de busca
function aplicarFiltro(tipo, valor) {
  const cards = document.querySelectorAll('.imovel-card');
  
  cards.forEach(card => {
    let mostrar = true;
    
    if (tipo === 'preco') {
      const precoTexto = card.querySelector('p').textContent;
      const preco = parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (valor === 'baixo' && preco > 200000) mostrar = false;
      if (valor === 'medio' && (preco < 200000 || preco > 500000)) mostrar = false;
      if (valor === 'alto' && preco < 500000) mostrar = false;
    }
    
    if (tipo === 'tipo') {
      const tipoImovel = card.querySelector('p:nth-child(3)').textContent.toLowerCase();
      if (valor !== 'todos' && !tipoImovel.includes(valor)) mostrar = false;
    }
    
    card.style.display = mostrar ? 'block' : 'none';
  });
}

// Menu hambúrguer responsivo e acessível
$(function() {
  const $menu = $('.hamburger-menu');
  const $nav = $('.header-nav .nav-menu');

  function toggleMenu() {
    $menu.toggleClass('active');
    $nav.toggleClass('active');
  }

  $menu.on('click', toggleMenu);
  $menu.on('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  // Fecha o menu ao clicar fora
  $(document).on('click', function(e) {
    if (!$menu.is(e.target) && $menu.has(e.target).length === 0 && !$nav.is(e.target) && $nav.has(e.target).length === 0) {
      $menu.removeClass('active');
      $nav.removeClass('active');
    }
  });
});