// Toggle side menu
$( ".open-side-menu" ).click( function() {
	if ( $( "#app-container" ).css( "margin-left" ) === "0px" ) {
		openSideMenu();
	} else {
		closeSideMenu();
	}
} );

// TODO: make this work
$( "#app-container" ).on( "swiperight", function() {
	openSideMenu();
} );
$( "#app-container" ).on( "swipeleft", function() {
	closeSideMenu();
} );

$( ".close-side-menu" ).click( function() {
	closeSideMenu();
} );

$( "#map" ).click( function( e ) {
	var clickedElement = e.target;
	if ( !clickedElement.classList.contains( 'btn-floating' ) ) {
		closeSideMenu();
	}
} );

function openSideMenu() {
	$( "#app-container" ).animate( {
		marginLeft: $( "#side-menu" ).width()
	} );
	$( ".fixed-action-btn" ).animate( {
		marginLeft: $( "#side-menu" ).width()
	} );
	$( "#side-menu" ).animate( {
		marginLeft: $( "#side-menu" ).width()
	} );
}

function closeSideMenu() {
	$( "#app-container" ).animate( {
		marginLeft: 0
	} );
	$( ".fixed-action-btn" ).animate( {
		marginLeft: 0
	} );
	$( "#side-menu" ).animate( {
		marginLeft: 0
	} );
}

$( ".show-located-pokemons" ).click( function() {
	showPokemonsInSideMenu();
} );

$( ".select-all-pokemons" ).click( function() {
	$( ".settings-container .pokemons .pokemon" ).addClass( "selected" );
	pokemonsToShow = rangeArray( 152 );
	refreshPokemons();
} );

$( ".deselect-all-pokemons" ).click( function() {
	$( ".settings-container .pokemons .pokemon" ).removeClass( "selected" );
	pokemonDB.loadedPokemons.clear().then( function() {
		latestPokemonsToShow = pokemonsToShow;

		for ( i = 0; i < markersList.length; i++ ) {
			console.log( "Removing" );
			map.removeLayer( markersList[ i ].marker );
		}
		markersList = [];
		pokemonsToShow = [];
	} );
} );

// Add and remove pokemons from Pokemons to Show

$( '.settings-container .pokemons' ).on( 'click', '.pokemon:not(.selected)', function() {
	$( this ).addClass( "selected" );
	pokemonsToShow.push( parseInt( $( this ).attr( "pokemonId" ) ) );
	refreshPokemons();
} );

$( '.settings-container .pokemons' ).on( 'click', '.pokemon.selected', function() {
	$( this ).removeClass( "selected" );
	var pokemonId = parseInt( $( this ).attr( "pokemonId" ) );
	removePokemonsFromMap( pokemonId );
} );

var $settingPokemonList = $( ".settings-container .pokemons" );
Object.keys( pokemonNames ).forEach( function( key ) {
	$settingPokemonList.append( '<div class="pokemon" pokemonId="' + key + '"><img src="http://assets.pokemon.com/assets/cms2/img/pokedex/detail/' + ( "00" + key ).slice( -3 ) + '.png" /><span>' + pokemonNames[ key ] + '</span></div>' );
} );
// Add selected class to those selected
if ( pokemonsToShow.length === 152 ) {
	$( ".settings-container .pokemons .pokemon" ).addClass( "selected" );
} else {
	for ( i = 0; i < pokemonsToShow.length; i++ ) {
		var pokemonId = pokemonsToShow[ i ];
		$( ".settings-container .pokemons .pokemon[pokemonId='" + pokemonId + "']" ).addClass( "selected" );
	}
}

// TODO: Save selected pokemons to the DB

// List Pokemons in Side Menu
function showPokemonsInSideMenu() {
	var sideMenuPokemons = [];
	pokemonDB.loadedPokemons
		.where( "created" )
		.between( Math.floor( Date.now() / 1000 ) - 60 * 15, Date.now(), false, true ) // false = first param not included when searching
		.toArray()
		.then( function( pokemons ) {
			for ( i = 0; i < pokemons.length; i++ ) {
				var pokemon = pokemons[ i ];
				var pokemonLatLng = {
					"lat": pokemon.lat,
					"lng": pokemon.lng
				};
				var distanceFromLocation;
				if ( locationMarker === undefined ) {
					distanceFromLocation = "N/A";
				} else {
					distanceFromLocation = distanceBetween( locationMarker.getLatLng(), pokemonLatLng );
				}
				sideMenuPokemons.push( {
					"id": pokemon.pokemonId,
					"lat": pokemon.lat,
					"lng": pokemon.lng,
					"distanceFromLocation": distanceFromLocation,
					"distanceFromCenter": distanceBetween( map.getCenter(), pokemonLatLng ),
				} );
			}
			addLocatedPokemonsToSideBar( sideMenuPokemons );
		} );
}

function sortByClosestFromLocation( a, b ) {
	if ( a.distanceFromLocation < b.distanceFromLocation )
		return -1;
	if ( a.distanceFromLocation > b.distanceFromLocation )
		return 1;
	return 0;
}

function sortByClosestFromCenter( a, b ) {
	if ( a.distanceFromCenter < b.distanceFromCenter )
		return -1;
	if ( a.distanceFromCenter > b.distanceFromCenter )
		return 1;
	return 0;
}

function addLocatedPokemonsToSideBar( pokemons ) {

	if ( locationMarker === undefined ) {
		pokemons.sort( sortByClosestFromCenter );
	} else {
		pokemons.sort( sortByClosestFromLocation );
	}

	$( '.located-pokemons' ).html( "" );
	for ( i = 0; i < pokemons.length; i++ ) {
		var pokemon = pokemons[ i ];
		var distance;
		if ( locationMarker === undefined ) {
			distance = "";
		} else {
			distance = pokemon.distanceFromLocation;
			if ( distance < 100 ) {
				distance = Math.round( distance ) + "m";
			} else if ( distance < 1000 ) { // < 1km
				distance = Math.round( distance / 10 ) * 10 + "m";
			} else { // > 1 km
				distance = Math.round( distance / 1000 ) + "km";
			}
		}
		$( '.located-pokemons' ).append( '<div class="pokemon">' +
			'<img src="http://assets.pokemon.com/assets/cms2/img/pokedex/detail/' + ( "00" + pokemon.id ).slice( -3 ) + '.png"' + '"/>' +
			"<h3>" + pokemonNames[ pokemon.id ].capitalize() + "</h3>" +
			pokemon.lat.toFixed( 5 ) + " " + pokemon.lng.toFixed( 5 ) + " " + distance +
			"</div>" );
	}
}

// Distance From Coordiantes Calculator
Number.prototype.toRad = function() {
	return this * ( Math.PI / 180 );
};

function distanceBetween( latLng1, latLng2 ) {
	var lat1 = latLng1.lat;
	var lat2 = latLng2.lat;
	var lng1 = latLng1.lng;
	var lng2 = latLng2.lng;
	var earthRadius = 6378137; // in meters
	var dLat = ( lat2 - lat1 ).toRad();
	var dLng = ( lng2 - lng1 ).toRad();
	lat1 = lat1.toRad();
	lat2 = lat2.toRad();
	var a = Math.sin( dLat / 2 ) * Math.sin( dLat / 2 ) +
		Math.sin( dLng / 2 ) * Math.sin( dLng / 2 ) * Math.cos( lat1 ) * Math.cos( lat2 );
	var c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );
	var distance = earthRadius * c;
	return Math.round( distance ); // returns value to the nearest meter
}
