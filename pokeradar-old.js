// ******** //
// LOAD MAP //
// ******** //

pokemonDB = {
	6: "charizard",
	9: "blastoise",
	26: "raichu",
	38: "ninetales",
	40: "wigglytuff",
	55: "golduck",
	59: "arcanine",
	62: "polywrath",
	94: "gengar",
	103: "exeggutor",
	108: "lickitung",
	130: "gyarados",
	131: "lapras",
	143: "snorlax",
	149: "dragonite",
	151: "new"
};

mapboxgl.accessToken = 'pk.eyJ1IjoicGFiaSIsImEiOiJjaXNhZGRzZWIwMDF4Mm5wdnk5YjVtcjM2In0.UzT4hfiPhDpV8EjbPhG5BQ';
var map = new mapboxgl.Map( {
	container: 'map',
	style: 'mapbox://styles/mapbox/light-v9',
	center: [ -73.9654, 40.7829 ],
	zoom: 11
} );

var total_pokemons = 0;

function findPokemon( pokemonId, minLatitude, maxLatitude, minLongitude, maxLongitude ) {
	total_pokemons = 0;
	$.get( "https://www.pokeradar.io/api/v1/submissions", {
		pokemonId: pokemonId,
		minLatitude: minLatitude,
		maxLatitude: maxLatitude,
		minLongitude: minLongitude,
		maxLongitude: maxLongitude
	}, function( data, status ) {
		if ( status == "success" ) {
			if ( data.success ) {
				data = data.data;
				for ( var i = 0; i < data.length; i++ ) {
					var pokemonId = data[ i ].pokemonId;
					if ( pokemonIsLegit( data[ i ] ) ) {
						addPokemonToMap( data[ i ] );
					}
				}
			}
		}
	} );
}

function pokemonIsLegit( pokemonData ) {
	var rarePokemon = true; //rarePokemon( pokemonData.pokemonId );
	vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );
	return true;

	if ( rarePokemon && vote_ratio > 0.75 && pokemonData.upvotes > 2 ) {
		return true;
	} else if ( !rarePokemon ) {
		return true;
	} else {
		return false;
	}
}

function rarePokemon( pokemonId ) {
	if ( pokemonId > 0 ) {
		return true;
	}
}

var features = [];
var source = {
	"type": "geojson",
	"data": {
		"type": "FeatureCollection",
		"features": features
	}
};

String.prototype.capitalize = function() {
	return this.charAt( 0 ).toUpperCase() + this.slice( 1 );
};

function addPokemonToMap( pokemonData ) {
	// pokemonData = {latitude: 40, longitude: -70, pokemonId: 48}
	var timeLeft = pokemonData.created + 15 * 60 - Math.floor( Date.now() / 1000 );
	var minutes = Math.floor( timeLeft / 60 );
	var seconds = timeLeft - minutes * 60;
	if ( seconds < 10 ) {
		seconds = "0" + seconds;
	}
	timeLeft = minutes + ":" + seconds;
	vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );
	found = false;
	for ( var i = 0; i < features.length; i++ ) {
		if ( features[ i ].properties.id === pokemonData.id ) {
			found = true;
		}
	}
	if ( !found ) {
		total_pokemons += 1;
		document.title = total_pokemons + " - Pokemon Radar Map";

		features.push( {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [ pokemonData.longitude, pokemonData.latitude ]
			},
			"properties": {
				"title": pokemonDB[ pokemonData.pokemonId ].capitalize() + " - " + timeLeft + " - " + pokemonData.upvotes + "/" + ( pokemonData.downvotes + pokemonData.upvotes ) + "-" + vote_ratio * 100 + "%",
				"id": pokemonData.id,
				"icon": "monument"
			}
		} );

		try {
			map.removeLayer( "pokemons" );
		} catch ( e ) {

		}
		try {
			map.removeSource( "pokemons" );
		} catch ( e ) {

		}

		map.addSource( "pokemons", source );

		map.addLayer( {
			"id": "pokemons",
			"type": "symbol",
			"source": "pokemons",
			"layout": {
				"icon-image": "{icon}-15",
				"text-field": "{title}",
				"text-font": [ "Open Sans Semibold", "Arial Unicode MS Bold" ],
				"text-offset": [ 0, 0.6 ],
				"text-anchor": "top"
			}
		} );
	}
}

function refreshPokemons() {
	Object.keys( pokemonDB ).forEach( function( pokemonId ) {
		findPokemon( pokemonId, lat().min, lat().max, lng().min, lng().max );
	} );
}

function lat() {
	map.getBounds();
	return {
		max: map.getBounds()._ne.lat,
		min: map.getBounds()._sw.lat
	};
}

function lng() {
	map.getBounds();
	return {
		max: map.getBounds()._ne.lng,
		min: map.getBounds()._sw.lng
	};
}

// ON MAP LOAD

map.on( 'load', function() {
	refreshPokemons();
} );

// map.on( 'zoom', function() {
// 	refreshPokemons();
// } );

window.setInterval( function() {
	refreshPokemons();
}, 30 * 1000 );
