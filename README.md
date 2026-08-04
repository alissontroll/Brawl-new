# Meu Brawl — site de estatísticas

Site que mostra os brawlers do jogador, o nível de poder de cada um, e sugere
uma ordem de quem upar primeiro, com um "foco do dia".

## ⚠️ Um detalhe importante antes de começar

O jogo (Supercell) só libera os dados de um jogador para um **servidor**, não
para o navegador direto. Ou seja: esse site **precisa rodar num servidor**
(não dá pra só abrir o arquivo no computador). Também é preciso avisar pra
Supercell qual é o "endereço" (IP) desse servidor. Por isso os passos abaixo
têm uma etapa de "hospedar" o site antes de pegar a chave.

Isso não vai te custar nada — dá pra fazer tudo de graça.

## Passo 1 — Colocar o site no ar (grátis, no Render)

1. Crie uma conta em https://render.com (dá pra entrar com GitHub).
2. Suba esta pasta pra um repositório no GitHub (ou peça ajuda pra alguém
   fazer isso — é só arrastar os arquivos lá no site do GitHub).
3. No Render, clique em **New > Web Service**, conecte o repositório.
4. Em **Start Command**, coloque: `gunicorn app:app`
5. Clique em criar. Em alguns minutos o Render te dá um endereço tipo
   `https://meubrawl.onrender.com` — anota esse link.

## Passo 2 — Pegar a chave da API

1. Entre em https://developer.brawlstars.com e crie uma conta (é o mesmo
   login do jogo).
2. Clique em **My Account > Create New Key**.
3. Em "IP Address", coloque o IP do servidor do Render (o próprio Render
   mostra esse IP na aba "Settings" do seu serviço, em "Outbound IP
   Addresses" — copie **todos** os IPs listados lá).
4. Salve e copie a chave gerada (uma sequência bem grande de letras/números).

## Passo 3 — Colocar a chave no site

1. No Render, vá em **Environment** (no menu do seu serviço).
2. Adicione uma variável chamada `BRAWL_API_KEY` e cole a chave que você
   copiou.
3. Salve — o Render reinicia o site sozinho.

Pronto! Agora é só abrir o link do seu site, colar a tag de um jogador
(tipo `#2Y8LVLU9`) e ver os dados aparecerem.

## Quer testar no seu computador antes?

```
pip install -r requirements.txt
export BRAWL_API_KEY=sua_chave_aqui
python app.py
```

Só que, como expliquei acima, a Supercell só libera os dados pra um IP fixo
autorizado — então isso só vai funcionar direto no seu PC se você configurar
seu IP de internet como autorizado (e ele pode mudar sozinho às vezes, o que
é chato). Rodar direto no Render já resolve isso de forma definitiva.

## Coisas que dá pra melhorar depois

- **Horas jogadas**: o jogo nunca mostra isso pra ninguém, nem pro próprio
  jogador — por isso o site não tem esse dado. Não existe nenhuma forma de
  conseguir essa informação, oficial ou não.
- **Lista de prioridade**: está no arquivo `priority_list.py`. Dá pra editar
  livremente conforme o meta do jogo for mudando.
- **Lembretes de verdade** (notificação no celular, por exemplo) precisam de
  mais uma peça (um serviço de notificações push). O "foco do dia" que já
  está no site funciona todo santo dia sozinho, só muda quando você abre o
  site — se quiser notificação de verdade fora do site, me chama que a gente
  monta isso depois.
