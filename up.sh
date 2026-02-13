#!/usr/bin/env bash
set -euo pipefail

DIR="assets/i18n"

# Edit the value for "view_current_location" in a JSON file.
# Assumes the value is a normal JSON string on one line (no embedded quotes).
replace_key () {
  local file="$1"
  local new_value="$2"

  perl -i -pe 's/("view_current_location"\s*:\s*")([^"]*)(")/$1'"$new_value"'$3/' "$file"
}

for f in "$DIR"/*.json; do
  lang="$(basename "$f" .json)"

  case "$lang" in
    en) v='View Live Map' ;;
    cs) v='Zobrazit živou mapu' ;;
    da) v='Se livekort' ;;
    de) v='Live-Karte anzeigen' ;;
    el) v='Προβολή ζωντανού χάρτη' ;;
    es) v='Ver mapa en vivo' ;;
    fr) v='Voir la carte en direct' ;;
    hr) v='Prikaži kartu uživo' ;;
    hu) v='Élő térkép megtekintése' ;;
    it) v='Visualizza mappa in tempo reale' ;;
    lt) v='Rodyti tiesioginį žemėlapį' ;;
    mt) v='Ara l-mappa live' ;;
    nl) v='Livekaart bekijken' ;;
    pl) v='Zobacz mapę na żywo' ;;
    pt) v='Ver mapa ao vivo' ;;
    ro) v='Vezi harta în direct' ;;
    sk) v='Zobraziť živú mapu' ;;
    sl) v='Prikaži zemljevid v živo' ;;
    sv) v='Visa livekarta' ;;
    uk) v='Переглянути карту наживо' ;;
    *)  echo "Skipping unknown language: $lang ($f)" ; continue ;;
  esac

  replace_key "$f" "$v"
  echo "Updated $f -> $v"
done
