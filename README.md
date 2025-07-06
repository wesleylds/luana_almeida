# Luana Almeida Imóveis

Site imobiliário para divulgação de imóveis em São Paulo.

## Funcionalidades
- Listagem de imóveis
- Página de detalhes com carrossel de imagens e mapa
- Busca e filtro de imóveis
- Contato via WhatsApp
- Painel administrativo (backend Node.js/Express)

## Tecnologias Utilizadas
- HTML5, CSS3, JavaScript (ES6+)
- jQuery, Slick Carousel, Swiper
- Node.js, Express, SQLite

## Como rodar o projeto
1. Clone o repositório
2. Instale as dependências do backend (`cd backend && npm install`)
3. Inicie o servidor backend (`node backend/server.js`)
4. Abra o `index.html` no navegador para testar o frontend

## Estrutura de Pastas
- `assets/styles/` - CSS do site
- `assets/scripts/` - JS do site
- `assets/images/` - Imagens
- `backend/` - Servidor Node.js e banco de dados

## Checklist de Robustez
- [x] Cadastro, edição e exclusão de imóveis funcionam
- [x] Upload e manutenção de imagens (fachada e carrossel)
- [x] Layout limpo, responsivo e intuitivo
- [x] Busca, filtro e contador de imóveis
- [x] Sistema de autenticação para admin
- [x] Backend seguro e validado
- [x] Erros críticos corrigidos (JS, backend, imagens)
- [x] Código limpo e organizado

## Observações
- Sempre faça backup antes de grandes mudanças.
- Siga boas práticas de organização e commits.
- Para imóveis antigos com imagens quebradas, edite e salve novamente para corrigir.
- Para produção, recomenda-se autenticação mais segura (ex: JWT).
- Se quiser, adicione um favicon personalizado em `/assets/favicon.png`.

---
Desenvolvido por Weslley Lemos de Sousa