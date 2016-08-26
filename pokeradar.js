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

L.mapbox.accessToken = 'pk.eyJ1IjoicGFiaSIsImEiOiJjaXNhZGRzZWIwMDF4Mm5wdnk5YjVtcjM2In0.UzT4hfiPhDpV8EjbPhG5BQ';
var map = L.mapbox.map( 'map', 'mapbox.streets' )
	.setView( [ 40.7829, -73.9654 ], 11 );

// loadedPokemons: {id: "1472225581-6-40.77319326--74.22933051", marker: markerObject, popup: popupObject}
var loadedPokemons = [];

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

String.prototype.capitalize = function() {
	return this.charAt( 0 ).toUpperCase() + this.slice( 1 );
};

function timeLeft( pokemonCreatedTs ) {
	var timeLeft = pokemonCreatedTs + 15 * 60 - Math.floor( Date.now() / 1000 );
	var minutes = Math.floor( timeLeft / 60 );
	var seconds = timeLeft - minutes * 60;
	if ( seconds < 10 ) {
		seconds = "0" + seconds;
	}
	timeLeft = minutes + ":" + seconds;
	return timeLeft;
}

function pokemonLoaded( id ) {
	for ( var i = 0; i < loadedPokemons.length; i++ ) {
		if ( loadedPokemons[ i ].id === id ) {
			return true;
		}
	}
	return false;
}

function popupData( pokemonId, createdAt, upVotes, downVotes ) {
	return pokemonDB[ pokemonId ].capitalize() + " - " + timeLeft( createdAt ) + " - " + upVotes + "/" + ( downVotes + upVotes ) + " - " + ( vote_ratio * 100 ).toFixed( 2 ) + "%";
}

function addPokemonToMap( pokemonData ) {
	// pokemonData = {latitude: 40, longitude: -70, pokemonId: 48}
	vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );
	if ( !pokemonLoaded( pokemonData.id ) ) {
		total_pokemons += 1;
		document.title = total_pokemons + " - Pokemon Radar Map";

		var marker = L.marker( [ pokemonData.latitude, pokemonData.longitude ] ).addTo( map );
		var popup = marker.bindPopup( popupData( pokemonData.pokemonId, pokemonData.created, pokemonData.upvotes, pokemonData.downvotes ) );

		loadedPokemons.push( {
			"id": pokemonData.id,
			"pokemonId": pokemonData.pokemonId,
			"created": pokemonData.created,
			"upvotes": upVotes,
			"downvotes": downVotes,
			"marker": marker,
			"popup": popup
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
		max: map.getBounds()._northEast.lat,
		min: map.getBounds()._southWest.lat
	};
}

function lng() {
	map.getBounds();
	return {
		max: map.getBounds()._northEast.lng,
		min: map.getBounds()._southWest.lng
	};
}

// LOAD POKEMONS ON MAP
refreshPokemons();

// UPDATES
window.setInterval( function() {
	updateTimeLeft();
}, 1000 );

function updateTimeLeft() {
	for ( var i = 0; i < loadedPokemons.length; i++ ) {
		loadedPokemons[ i ].created;
	}
}
