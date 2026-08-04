# -----------------------------------------------------------------------------
# LISTA DE PRIORIDADE DE UPGRADE
# -----------------------------------------------------------------------------
# Isso é só uma sugestão de "quem upar primeiro", baseada em quão fortes e
# versáteis os brawlers costumam ser em ranked/trophy push no geral.
# Quanto MENOR o número, MAIOR a prioridade (1 = upar primeiro).
#
# IMPORTANTE: o balanceamento do jogo muda com frequência (patches novos saem
# toda season). Edite essa lista sempre que quiser ajustar as prioridades -
# é só mudar o número na frente do nome do brawler.
# -----------------------------------------------------------------------------

PRIORITY = {
    # Tier 1 - focar primeiro (fortes e fáceis de usar bem)
    "Angelo": 1, "Kenji": 1, "Meeple": 1, "Chuck": 1, "Larry & Lawrie": 1,
    "Melodie": 1, "Kit": 1, "Berry": 1, "Mico": 1, "Buster": 1,
    "Otis": 1, "Ollie": 1,

    # Tier 2 - muito bons, upar em seguida
    "Poco": 2, "El Primo": 2, "Bull": 2, "Rico": 2, "Spike": 2,
    "Crow": 2, "Leon": 2, "Gus": 2, "Fang": 2, "Eve": 2,
    "Janet": 2, "Draco": 2, "Cordelius": 2, "Chester": 2, "Gray": 2,
    "Griff": 2, "R-T": 2, "Sam": 2, "Jae-Yong": 2, "Lily": 2,

    # Tier 3 - sólidos, upar depois dos anteriores
    "Shelly": 3, "Colt": 3, "Bull": 3, "Brock": 3, "Dynamike": 3,
    "Bo": 3, "Piper": 3, "Pam": 3, "Barley": 3, "Nita": 3,
    "Mortis": 3, "Tara": 3, "Gene": 3, "Max": 3, "Mr. P": 3,
    "Belle": 3, "Ash": 3, "Buzz": 3, "Fang": 3, "Squeak": 3,
    "Grom": 3, "Bonnie": 3, "Ruffs": 3, "Moe": 3, "Juju": 3,
}

DEFAULT_PRIORITY = 4  # qualquer brawler fora da lista cai aqui (prioridade baixa)


def get_priority(brawler_name: str) -> int:
    return PRIORITY.get(brawler_name, DEFAULT_PRIORITY)
