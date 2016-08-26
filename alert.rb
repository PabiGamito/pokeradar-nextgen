require_relative 'pokeradar-api-wrapper.rb'

# Charizard 6
# Blastoise 9
# Raichu 26
# Ninetales 38
# Wigglytuff 40
# Golduck 55
# Arcanine 59
# Poliwrath 62
# Gengar 94
# Exeggutor 103
# Lickitung 108
# Gyarados 130
# Lapras 131
# Snorlax	143
# Dragonite 149
# Mew 151

my_pokemons = [6, 9, 26, 38, 40, 55, 59, 62, 94, 103, 108, 130, 131, 143, 149]

def pokemon_legit?(pokemon_data)
  upvotes = pokemon_data["upvotes"].to_f
  total_votes = upvotes + pokemon_data["downvotes"]
  vote_ratio = upvotes / total_votes
  if upvotes > 1 && vote_ratio > 0.75
    return true
  else
    return false
  end
end

def pokemon_is_rare?(pokemon_id)
  return true
end

my_pokemons.each do |pokemon_id|
  data = Pokeradar.find(pokemon_id, 40.57432635193039, 40.98197154086656, -74.48043823242188, -73.48068237304688)
  data.each do |pokemon|
    if pokemon_is_rare?(pokemon["pokemonId"])
      if pokemon_legit?(pokemon)
        # SHOW POKEMON
        puts "============="
        puts "Pokemon found"
        puts "Pokemon ID: #{pokemon["pokemonId"]}"
        puts "Location #{pokemon["latitude"]} - #{pokemon["longitude"]}"
        puts "============="
      else
        puts "============="
        puts "FAKE"
        puts "============="
      end
    else
      # SHOW POKEMON
    end

  end
end
