// ******** //
// LOAD MAP //
// ******** //

L.mapbox.accessToken = 'pk.eyJ1IjoicGFiaSIsImEiOiJjaXNhZGRzZWIwMDF4Mm5wdnk5YjVtcjM2In0.UzT4hfiPhDpV8EjbPhG5BQ';
var map = L.mapbox.map( 'map', 'mapbox.outdoors' )
	.setView( [ 40.7829, -73.9654 ], 11 );

// Minzoom to prevent to big surface to scan error
map.options.minZoom = 3;

var pokemonsToShow = [ 6, 9, 26, 38, 40, 55, 59, 62, 94, 103, 108, 130, 131, 143, 149 ];
var total_pokemons = 0;
var markers = new L.MarkerClusterGroup();
var markersList = [];

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
	timeLeft = minutes + ":" + ( "0" + seconds ).slice( -2 );
	return timeLeft;
}

function loadPopupContent( marker, pokemonId, upVotes, downVotes ) {
	pokemonDB.pokemons.get( pokemonId ).then( function( pokemon ) {
		vote_ratio = upVotes / ( downVotes + upVotes );
		marker._popup.setContent( "<h3>" + pokemon.name.capitalize() + "</h3>" +
			"<p>" + upVotes + "/" + ( downVotes + upVotes ) + " - " + ( vote_ratio * 100 ).toFixed( 2 ) + "%" + "</p>" +
			'<i class="fa fa-thumbs-up" aria-hidden="true"></i>' + '<i class="fa fa-thumbs-down" aria-hidden="true"></i>' );
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
					iconUrl: 'http://assets.pokemon.com/assets/cms2/img/pokedex/detail/' + ( "00" + pokemonData.pokemonId ).slice( -3 ) + '.png',
					iconSize: [ 64, 64 ]
				} )
			} ).bindLabel( '<i class="fa fa-check-circle" aria-hidden="true"></i> <span created="' + pokemonData.created + '">' + timeLeft( pokemonData.created ) + '</span>', {
				noHide: true,
				offset: [ -20, 20 ],
				className: "pokemonLabel"
			} ).addTo( map );
			marker.bindPopup( "Loading" );
			loadPopupContent( marker, pokemonData.pokemonId, pokemonData.upvotes, pokemonData.downvotes );

			markersList.push( {
				"marker": marker,
				"created": pokemonData.created
			} );
			markers.addLayer( marker );

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
	deleteExpiredPokemons();
}, 1000 );

function updateTimeLeft() {
	$( ".pokemonLabel span" ).each( function() {
		var created = parseInt( $( this ).attr( "created" ) );
		$( this ).text( timeLeft( created ) );
	} );
}

function deleteExpiredPokemons() {
	pokemonDB.loadedPokemons
		.where( "created" )
		.between( 0, Math.floor( Date.now() / 1000 ) - 60 * 15 )
		.delete();

	for ( i = 0; i < markersList.length; i++ ) {
		if ( markersList[ i ].created <= Math.floor( Date.now() / 1000 ) - 60 * 15 ) {
			map.removeLayer( markersList[ i ].marker );
		}
	}
}
}
}
