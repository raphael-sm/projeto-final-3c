# Documentação da API

- UI: `/api/docs`
- OpenAPI: `/api/docs/openapi.yaml`
- Servidor OpenAPI: `/api` (os caminhos não repetem o prefixo)

## Autenticação observada no backend

`POST /api/auth/register` e `POST /api/auth/login` retornam um token pessoal criado por `createToken('auth')`. As rotas protegidas usam `auth:sanctum`; o middleware `auth.optional` só tenta autenticar quando há Bearer token. Envie `Authorization: Bearer <token>`. O login revoga os tokens anteriores do usuário e o logout revoga o token usado.

Embora `config/cors.php` permita credentials e `config/sanctum.php` contenha domínios stateful, `bootstrap/app.php` não instala `EnsureFrontendRequestsAreStateful` no grupo API e `AuthService` emite tokens pessoais. Portanto esta documentação não descreve fluxo de cookie/CSRF.

## Acesso

- Público: leitura de categorias/produtos/imagens; registro e login.
- Carrinho: endpoints públicos com autenticação opcional; autorização de propriedade é aplicada no serviço para alterar/remover itens.
- Autenticado: perfil, endereços próprios, merge, checkout e pedidos próprios.
- Admin: escrita em categorias/produtos/imagens e transição de status de pedidos. O middleware `admin` compara `user.role.name === 'admin'`.
- Administradores não recebem acesso especial aos endereços de outros usuários. Pedidos são filtrados por proprietário, exceto para admin.

## Assets locais do Swagger UI

A distribuição oficial `swagger-ui-dist` (Apache-2.0) precisa ser copiada para `assets/`. A origem do projeto enviado não continha os arquivos de distribuição, e o ambiente de execução não tinha conectividade de saída para obtê-los. Para completar o vendoring em um ambiente com npm/rede:

```sh
mkdir -p /tmp/swagger-ui-dist
cd /tmp/swagger-ui-dist
npm pack swagger-ui-dist@5.34.1
 tar -xzf swagger-ui-dist-5.34.1.tgz
cp package/dist/* /caminho/da/API/public/api/docs/assets/
```

A página já referencia os assets locais `swagger-ui.css` e `swagger-ui-bundle.js`, e carrega exatamente `/api/docs/openapi.yaml`.

## Inconsistência identificada no código

`StoreProductRequest` não valida `category_id`, mas a migration de `products` declara `category_id` obrigatório e sem valor padrão. Como `ProductController::store` envia apenas `$request->validated()` ao serviço, o `POST /products` tende a falhar na inserção no banco. A especificação registra essa ressalva em vez de fingir que `category_id` é aceito pelo Form Request. Não alterei o comportamento da rota.
