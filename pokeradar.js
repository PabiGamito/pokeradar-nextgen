// ******** //
// LOAD MAP //
// ******** //

L.mapbox.accessToken = 'pk.eyJ1IjoicGFiaSIsImEiOiJjaXNhZGRzZWIwMDF4Mm5wdnk5YjVtcjM2In0.UzT4hfiPhDpV8EjbPhG5BQ';
var map = L.mapbox.map( 'map', 'mapbox.outdoors', {
		zoomControl: false
	} )
	.setView( [ 0, 0 ], 3 );

// Minzoom to prevent to big surface to scan error
map.options.minZoom = 3;

// Custom map controls
var zoomInControl = L.Control.extend( {
	options: {
		position: 'topleft'
	},
	onAdd: function( map ) {
		var container = L.DomUtil.create( 'div', 'btn-floating white zoomInControl' );

		container.onclick = function() {
			map.setView( map.getCenter(), map.getZoom() + 1 );
		};
		return container;
	}

} );

var zoomOutControl = L.Control.extend( {
	options: {
		position: 'topleft'
	},
	onAdd: function( map ) {
		var container = L.DomUtil.create( 'div', 'btn-floating white zoomOutControl' );

		container.onclick = function() {
			map.setView( map.getCenter(), map.getZoom() - 1 );
		};
		return container;
	}

} );

var locateControl = L.Control.extend( {
	options: {
		position: 'topright'
	},
	onAdd: function( map ) {
		var container = L.DomUtil.create( 'div', 'btn-floating white locateControl' );

		container.onclick = function() {
			map.locate( {
					setView: true,
					watch: true,
					maxZoom: 17
				} ) /* This will return map so you can do chaining */
				.on( 'locationfound', function( e ) {
					var locationIcon = L.icon( {
						iconUrl: 'img/icons/locationIcon.png',
						iconSize: [ 32, 32 ], // size of the icon
					} );
					map.setView( [ e.latitude, e.longitude ], 16 );
					// var marker = L.marker( [ e.latitude, e.longitude ], {
					// 	"icon": locationIcon
					// } );
					var circle = L.circle( [ e.latitude, e.longitude ], e.accuracy / 2, {
						weight: 1,
						color: 'blue',
						fillColor: '#cacaca',
						fillOpacity: 0.2
					} );
					map.addLayer( circle );
					refreshPokemons();
				} )
				.on( 'locationerror', function( e ) {
					console.log( e );
					refreshPokemons();
				} );
		};
		return container;
	}

} );

map.addControl( new zoomInControl() );
map.addControl( new zoomOutControl() );
map.addControl( new locateControl() );

// END LOAD MAP

var pokemonsToShow = [ 6, 9, 26, 38, 40, 55, 59, 62, 94, 103, 108, 130, 131, 143, 149 ];
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
					addPokemonToMap( data[ i ] );
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
	pokemonDB.pokemons.get( pokemonData.pokemonId ).then( function( pokemon ) {
		vote_ratio = pokemonData.upvotes / ( pokemonData.downvotes + pokemonData.upvotes );
		marker._popup.setContent( "<h3>" + pokemon.name.capitalize() + "</h3>" +
			"<p>" + pokemonData.upvotes + "/" + ( pokemonData.downvotes + pokemonData.upvotes ) + " - " + Math.round( vote_ratio * 100 * 100 ) / 100 + "%" + "</p>" +
			"<p>" + pokemonData.latitude.toFixed( 5 ) + " " + pokemonData.longitude.toFixed( 5 ) + "</p>" + // coordinates decimal place accuracy http://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude/8674#8674
			'<i class="fa fa-thumbs-down" aria-hidden="true"></i>' + '<i class="fa fa-thumbs-up" aria-hidden="true"></i>' );
	} );
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
	pokemonDB.loadedPokemons.get( pokemonData.id ).then( function( pokemon ) {
		var marker;
		if ( pokemon ) {
			// if Pokemon already loaded + saved in loadedPokemons table
			for ( i = 0; i < markersList.length; i++ ) {
				if ( markersList[ i ].id === pokemonData.id ) {
					marker = markersList[ i ].marker;
					loadPopupContent( marker, pokemonData );
				}
			}
		} else {
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
			} ).addTo( map );
			marker.bindPopup( "Loading" );
			loadPopupContent( marker, pokemonData );

			markersList.push( {
				"id": pokemonData.id,
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
map.locate( {
		setView: true,
		watch: true,
		maxZoom: 17
	} )
	.on( 'locationfound', function( e ) {
		map.setView( [ e.latitude, e.longitude ], 16 );
		refreshPokemons();
		StartAutoUpdates();
	} )
	.on( 'locationerror', function( e ) {
		console.log( e );
		refreshPokemons();
		StartAutoUpdates();
	} );

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

	for ( i = 0; i < markersList.length; i++ ) {
		if ( markersList[ i ].created <= Math.floor( Date.now() / 1000 ) - 60 * 15 ) {
			map.removeLayer( markersList[ i ].marker );
			markersList.splice( i, 1 );
		}
	}
}
