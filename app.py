import os
import time
import datetime
import requests
from urllib.parse import quote
from flask import Flask, render_template, jsonify, request

from priority_list import get_priority

app = Flask(__name__)

# -----------------------------------------------------------------------------
# CONFIGURAÇÃO
# -----------------------------------------------------------------------------
# Pegue sua chave grátis em https://developer.brawlstars.com
# e coloque como variável de ambiente BRAWL_API_KEY (veja o README.md).
BRAWL_API_KEY = os.environ.get("BRAWL_API_KEY", "")
OFFICIAL_API_BASE = "https://bsproxy.royaleapi.dev/v1"
BRAWLAPI_BASE = "https://api.brawlapi.com/v1"  # dados públicos dos brawlers, sem chave

# cache simples em memória pra lista de brawlers (nomes/ícones), atualiza a cada 1h
_brawler_cache = {"data": None, "ts": 0}


def get_brawler_catalog():
    """Busca a lista oficial de brawlers (nome -> ícone) na BrawlAPI, com cache."""
    now = time.time()
    if _brawler_cache["data"] and now - _brawler_cache["ts"] < 3600:
        return _brawler_cache["data"]
    try:
        resp = requests.get(f"{BRAWLAPI_BASE}/brawlers", timeout=10)
        resp.raise_for_status()
        catalog = {}
        for b in resp.json().get("list", []):
            catalog[b["name"]] = {
                "imageUrl": b.get("imageUrl2") or b.get("imageUrl"),
            }
        _brawler_cache["data"] = catalog
        _brawler_cache["ts"] = now
        return catalog
    except requests.RequestException:
        return _brawler_cache["data"] or {}


def normalize_tag(raw_tag: str) -> str:
    tag = raw_tag.strip().upper().replace("O", "0")  # erro comum: O maiúsculo por zero
    if not tag.startswith("#"):
        tag = "#" + tag
    return tag


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/player/<path:tag>")
def player_data(tag):
    if not BRAWL_API_KEY:
        return jsonify({
            "error": "config",
            "message": "O site ainda não tem a chave da API configurada. Veja o README.md."
        }), 500

    clean_tag = normalize_tag(tag)
    encoded_tag = quote(clean_tag)  # o '#' precisa virar %23

    headers = {"Authorization": f"Bearer {BRAWL_API_KEY}"}
    try:
        r = requests.get(f"{OFFICIAL_API_BASE}/players/{encoded_tag}", headers=headers, timeout=10)
    except requests.RequestException:
        return jsonify({"error": "network", "message": "Não consegui falar com o servidor do jogo. Tenta de novo."}), 502

    if r.status_code == 404:
        return jsonify({"error": "not_found", "message": "Não achei nenhum jogador com essa tag. Confere se digitou certo."}), 404
    if r.status_code == 403:
        return jsonify({"error": "forbidden", "message": "A chave da API não está autorizada para o IP deste servidor. Veja o README.md."}), 500
    if not r.ok:
        return jsonify({"error": "upstream", "message": "O servidor do jogo deu erro. Tenta de novo em alguns minutos."}), 502

    player = r.json()
    catalog = get_brawler_catalog()

    brawlers = []
    for b in player.get("brawlers", []):
        name = b.get("name", "")
        power = b.get("power", 0)
        trophies = b.get("trophies", 0)
        priority = get_priority(name)
        brawlers.append({
            "name": name,
            "power": power,
            "trophies": trophies,
            "rank": b.get("rank", 0),
            "imageUrl": catalog.get(name, {}).get("imageUrl", ""),
            "priority": priority,
            "maxed": power >= 11,
        })

    # ordena: prioridade mais alta (número menor) primeiro, e dentro dela quem tem menos poder
    focus_list = sorted(
        [b for b in brawlers if not b["maxed"]],
        key=lambda b: (b["priority"], b["power"])
    )

    # brawler do dia: roda entre os 5 primeiros da lista de foco, mudando por dia
    today_index = datetime.date.today().toordinal()
    today_focus = None
    if focus_list:
        top_pool = focus_list[:5] if len(focus_list) >= 5 else focus_list
        today_focus = top_pool[today_index % len(top_pool)]

    result = {
        "name": player.get("name"),
        "tag": player.get("tag"),
        "trophies": player.get("trophies"),
        "highestTrophies": player.get("highestTrophies"),
        "expLevel": player.get("expLevel"),
        "club": (player.get("club") or {}).get("name"),
        "3vs3Victories": player.get("3vs3Victories"),
        "soloVictories": player.get("soloVictories"),
        "duoVictories": player.get("duoVictories"),
        "brawlersOwned": len(brawlers),
        "brawlers": sorted(brawlers, key=lambda b: (-b["trophies"])),
        "focusList": focus_list[:10],
        "todayFocus": today_focus,
    }
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
