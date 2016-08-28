var pokemonsToShow = [ "" ];
var markersList = [];
var savePokemonData;
var refreshPokemonsInProgress = false;

function parsePokemonId( id ) {
	var idParts = id.split( "-" );
	var parsedId = idParts[ 0 ] + "-" + idParts[ 1 ] + "-" + parseFloat( idParts[ 2 ] ).toFixed( 6 ) + "-" + parseFloat( idParts[ 3 ] ).toFixed( 6 );
	return parsedId;
}

function findPokemon( pokemonId, minLatitude, maxLatitude, minLongitude, maxLongitude, lastSearch ) {
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
				// Unify IDs
				for ( var i = 0; i < data.length; i++ ) {
					data[ i ].id = parsePokemonId( data[ i ].id );
				}
				var lastSearchDone = false;
				addPokemonToMap( data[ 0 ] );
				for ( var i = 1; i < data.length; i++ ) {
					var pokemonData = data[ i - 1 ];
					var newPokemonData = data[ i ];
					if ( savePokemonData ) {
						pokemonDB.loadedPokemons.put( {
							"id": pokemonData.id,
							"pokemonId": pokemonData.pokemonId,
							"userId": pokemonData.userId,
							"created": pokemonData.created,
							"lat": pokemonData.latitude.toFixed( 6 ),
							"lng": pokemonData.longitude.toFixed( 6 )
								// "marker": marker
						} ).then( function() {
							// To make sure pokemons are not placed twice on map
							addPokemonToMap( newPokemonData );
						} );
					} else {
						addPokemonToMap( newPokemonData );
					}
				}
				if ( savePokemonData ) {
					var pokemonData = data[ data.length - 1 ];
					pokemonDB.loadedPokemons.put( {
						"id": pokemonData.id,
						"pokemonId": pokemonData.pokemonId,
						"userId": pokemonData.userId,
						"created": pokemonData.created,
						"lat": pokemonData.latitude.toFixed( 6 ),
						"lng": pokemonData.longitude.toFixed( 6 )
							// "marker": marker
					} ).then( function() {
						lastSearchDone = true;
						if ( lastSearch ) {
							refreshPokemonsInProgress = false;
						}
					} );
				}
				setTimeout( function() {
					// Incase there is an error saving last query to DB
					if ( lastSearch && !lastSearchDone ) {
						refreshPokemonsInProgress = false;
					}
				}, 200 );
			} else if ( lastSearch ) {
				refreshPokemonsInProgress = false;
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
		// .where( '[pokemonId+lat+lng]' )
		// .equals( [ pokemonData.pokemonId, pokemonData.latitude.toFixed( 6 ), pokemonData.longitude.toFixed( 6 ) ] )
		.get( pokemonData.id )
		.then( function( pokemon ) {
			if ( !pokemon ) {
				// console.log( "Pokemon not found in DB", pokemonData.id )
			}
			var marker;
			// console.log( "Pokemon", pokemon, "equal", [ pokemonData.userId, pokemonData.pokemonId, pokemonData.latitude, pokemonData.longitude ] );
			if ( pokemon && ( pokemon.userId === "13661365" || pokemonData.userId !== "13661365" ) ) {
				// if Pokemon already loaded + already from Pokeradar Prediction or the newer duplicate is not from pokeradar predictions
				savePokemonData = false;
				for ( i = 0; i < markersList.length; i++ ) {
					if ( markersList[ i ].id === pokemonData.id ) {
						marker = markersList[ i ].marker;
						loadPopupContent( marker, pokemonData );
						// TODO: Also update verified icon on icon label
					}
				}
			} else {
				savePokemonData = true;
				if ( pokemon && pokemonData.userId === "13661365" ) {
					// if duplicate pokemon from poke radar predictions delete old one and add new one
					savePokemonData = false;
					pokemon.update( {
						id: pokemonData.id,
						userId: pokemonData.userId
					} );
					for ( i = 0; i < markersList.length; i++ ) {
						if ( markersList[ i ].id === pokemonData.id ) {
							map.removeLayer( markersList[ i ].marker );
							markersList.splice( i, 1 );
						}
					}
				}
				// Add pokemon to map
				// if Pokemon not already loaded or because duplicate deleted and needs to be replaces with new one
				marker = L.marker( [ pokemonData.latitude.toFixed( 6 ), pokemonData.longitude.toFixed( 6 ) ], {
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

				// Should fix duplicate pokemon spawning
				// TODO: This seems to work as a quick fix, but I need to figure out why some pokemons are not being saved to the database
				// NOTE: There maybe to same pokemon with one having slighlty more precise coordinates which will cause both to spawn
				var alreadySpawn = false;
				for ( i = 0; i < markersList.length; i++ ) {
					if ( markersList[ i ].id.match( /.+?(?=-)/ )[ 0 ] === pokemonData.id.match( /.+?(?=-)/ )[ 0 ] ) {
						alreadySpawn = true;
					}
				}

				markersList.push( {
					"id": pokemonData.id,
					// "userId": pokemonData.userId,
					"pokemonId": pokemonData.pokemonId,
					"marker": marker,
					"created": pokemonData.created
				} );

				if ( !alreadySpawn ) {
					// console.log( "Adding marker", pokemonData );
					markerClusters.addLayer( marker );
				}

			}
		} );
}

function refreshPokemons() {
	if ( !refreshPokemonsInProgress ) {
		refreshPokemonsInProgress = true;
		for ( var i = 0; i < pokemonsToShow.length; i++ ) {
			if ( i === pokemonsToShow.length - 1 ) {
				findPokemon( pokemonsToShow[ i ], lat().min, lat().max, lng().min, lng().max, true );
			} else {
				findPokemon( pokemonsToShow[ i ], lat().min, lat().max, lng().min, lng().max, false );
			}
		}
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
