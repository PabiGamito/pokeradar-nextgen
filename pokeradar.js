// ******** //
// LOAD MAP //
// ******** //

L.mapbox.accessToken = 'pk.eyJ1IjoicGFiaSIsImEiOiJjaXNhZGRzZWIwMDF4Mm5wdnk5YjVtcjM2In0.UzT4hfiPhDpV8EjbPhG5BQ';
var map = L.mapbox.map( 'map', 'mapbox.streets' )
	.setView( [ 40.7829, -73.9654 ], 11 );

// Minzoom to prevent to big surface to scan error
map.options.minZoom = 3;

var pokemonsToShow = [ 6, 9, 26, 38, 40, 55, 59, 62, 94, 103, 108, 130, 131, 143, 149 ];
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

	if ( rarePokemon && vote_ratio > 0.70 && pokemonData.upvotes > 1 ) {
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
	timeLeft = minutes + ":" + ( "0" + seconds ).slice( -2 );
	return timeLeft;
}

function loadPopupContent( marker, pokemonId, upVotes, downVotes ) {
	pokemonDB.pokemons.get( pokemonId ).then( function( pokemon ) {
		vote_ratio = upVotes / ( downVotes + upVotes );
		marker._popup.setContent( "<h3>" + pokemon.name.capitalize() + "</h3>" + upVotes + "/" + ( downVotes + upVotes ) + " - " + ( vote_ratio * 100 ).toFixed( 2 ) + "%" );
	} );
}

function addPokemonToMap( pokemonData ) {
	// pokemonData = {latitude: 40, longitude: -70, pokemonId: 48}
	pokemonDB.loadedPokemons.get( pokemonData.id ).then( function( pokemon ) {
		if ( !pokemon ) {
			total_pokemons += 1;
			document.title = total_pokemons + " - Pokemon Radar Map";

			var marker = L.marker( [ pokemonData.latitude, pokemonData.longitude ], {
				icon: L.icon( {
					iconUrl: 'img/icons/' + pokemonData.pokemonId + '.png',
					iconSize: [ 64, 64 ]
				} )
			} ).bindLabel( timeLeft( pokemonData.created ), {
				noHide: true,
				offset: [ -20, 30 ],
				className: "pokemonLabel"
			} ).addTo( map );
			marker.bindPopup( "Loading" );
			loadPopupContent( marker, pokemonData.pokemonId, pokemonData.upvotes, pokemonData.downvotes );

			pokemonDB.loadedPokemons.put( {
				"id": pokemonData.id,
				"pokemonId": pokemonData.pokemonId,
				"created": pokemonData.created
					// "marker": marker
			} );

		}
	} );
}

function refreshPokemons() {
	for ( var i = 0; i < pokemonsToShow.length; i++ ) {
		findPokemon( pokemonsToShow[ i ], lat().min, lat().max, lng().min, lng().max );
	}
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
map.on( 'moveend', function() {
	refreshPokemons();
} );

window.setInterval( function() {
	refreshPokemons();
}, 10000 );

window.setInterval( function() {
	updateTimeLeft();
}, 1000 );

function updateTimeLeft() {
	$( ".pokemonLabel" ).each( function() {
		var timeLeft = $( this ).text();
		var minutes = timeLeft.split( ":" )[ 0 ];
		var seconds = timeLeft.split( ":" )[ 1 ];
		if ( seconds > 0 ) {
			seconds -= 1;
		} else if ( minutes > 0 ) {
			minutes -= 1;
			seconds = 59;
		} else {
			return $( this ).text( "gone" );
		}
		$( this ).text( minutes + ":" + ( "0" + seconds ).slice( -2 ) );
	} );
}

function deleteExpiredPokemons() {
	pokemonDB.loadedPokemons
		.where( "created" )
		.between( 0, Math.floor( Date.now() / 1000 ) - 60 * 15 )
		.toArray()
		.then( function( pokemons ) {
			// TODO: Delete from map and DB
			console.log( pokemons );
		} );
}
