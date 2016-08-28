var pokemonsToShow = [ 6, 9, 26, 38, 40, 55, 59, 62, 94, 103, 108, 130, 131, 143, 149 ];
var markersList = [];
var newPokemonData;

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
			if ( data.success && data.data.length > 0 ) {
				data = data.data;
				addPokemonToMap( data[ 0 ] );
				for ( var i = 1; i < data.length; i++ ) {
					var pokemonData = data[ i - 1 ];
					newPokemonData = data[ i ];
					pokemonDB.loadedPokemons.put( {
						"id": pokemonData.id,
						"pokemonId": pokemonData.pokemonId,
						"created": pokemonData.created,
						"lat": pokemonData.latitude,
						"lng": pokemonData.longitude
							// "marker": marker
					} ).then( function() {
						// To make sure pokemons are not placed twice on map
						addPokemonToMap( newPokemonData );
					} );
				}
			}
		}
	} );
}

function pokemonIsLegit( pokemonData ) {
	var rarePokemon = true; //TODO: rarePokemon( pokemonData.pokemonId );
	vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );

	if ( pokemonData.userId === "13661365" ) {
		// 13661365 = (Poke Radar Prediction)
		return true;
	} else if ( vote_ratio > 0.75 && pokemonData.upvotes > 5 ) {
		return true;
	} else if ( vote_ratio < 0.5 ) {
		return false;
	} else {
		return "n/a";
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

function loadPopupContent( marker, pokemonData ) {
	vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );
	marker._popup.setContent( "<h3>" + pokemonNames[ pokemonData.pokemonId ].capitalize() + "</h3>" +
		"<p>" + pokemonData.upvotes + "/" + ( pokemonData.downvotes + pokemonData.upvotes ) + " - " + Math.round( vote_ratio * 100 * 100 ) / 100 + "%" + "</p>" +
		"<p>" + pokemonData.latitude.toFixed( 5 ) + " " + pokemonData.longitude.toFixed( 5 ) + "</p>" + // coordinates decimal place accuracy http://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude/8674#8674
		'<i class="fa fa-thumbs-down" aria-hidden="true"></i>' + '<i class="fa fa-thumbs-up" aria-hidden="true"></i>' );
}

function addPokemonToMap( pokemonData ) {
	// pokemonData = {latitude: 40, longitude: -70, pokemonId: 48}
	var confirmedCircle;
	if ( pokemonIsLegit( pokemonData ) === "n/a" ) {
		confirmedCircle = '';
	} else if ( pokemonIsLegit( pokemonData ) ) {
		confirmedCircle = '<i class="fa fa-check-circle" aria-hidden="true"></i> ';
	} else {
		confirmedCircle = '<i class="fa fa-times-circle" aria-hidden="true"></i> ';
	}
	pokemonDB.loadedPokemons
		.where( '[pokemonId+lat+lng]' )
		.equals( [ pokemonData.pokemonId, pokemonData.latitude, pokemonData.longitude ] )
		.first()
		.then( function( pokemon ) {
			var marker;
			if ( pokemon && pokemonData.userId !== "13661365" ) {
				// if Pokemon already loaded + saved in loadedPokemons table
				for ( i = 0; i < markersList.length; i++ ) {
					if ( markersList[ i ].id === pokemonData.id ) {
						marker = markersList[ i ].marker;
						loadPopupContent( marker, pokemonData );
					}
				}
			} else {
				if ( pokemon && pokemonData.userId === "13661365" ) {
					pokemon.delete();
				}
				// if Pokemon not already loaded + not saved in loadedPokemons table
				marker = L.marker( [ pokemonData.latitude, pokemonData.longitude ], {
					icon: L.icon( {
						iconUrl: 'http://assets.pokemon.com/assets/cms2/img/pokedex/detail/' + ( "00" + pokemonData.pokemonId ).slice( -3 ) + '.png',
						iconSize: [ 64, 64 ]
					} )
				} ).bindLabel( confirmedCircle + '<span created="' + pokemonData.created + '">' + timeLeft( pokemonData.created ) + '</span>', {
					noHide: true,
					offset: [ -20, 20 ],
					className: "pokemonLabel"
				} );
				marker.bindPopup( "Loading" );
				loadPopupContent( marker, pokemonData );

				markersList.push( {
					"id": pokemonData.id,
					"marker": marker,
					"created": pokemonData.created
				} );

				markerClusters.addLayer( marker );

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
function StartAutoUpdates() {
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
}

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

	// TODO: Iterate only through pokemon markers that are not bundled in a cluster to prevent lag
	for ( i = 0; i < markersList.length; i++ ) {
		if ( markersList[ i ].created <= Math.floor( Date.now() / 1000 ) - 60 * 15 ) {
			map.removeLayer( markersList[ i ].marker );
			markersList.splice( i, 1 );
		}
	}
}
