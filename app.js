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

function addLocatedPokemonsToSideBar( pokemons ) {
	$( '.located-pokemons' ).html( "" );
	for ( i = 0; i < pokemons.length; i++ ) {
		var pokemon = pokemons[ i ];
		$( '.located-pokemons' ).append( '<div class="pokemon">' +
			'<img src="http://assets.pokemon.com/assets/cms2/img/pokedex/detail/' + ( "00" + pokemon.id ).slice( -3 ) + '.png"' + '"/>' +
			"<h3>" + pokemonNames[ pokemon.id ].capitalize() + "</h3>" +
			pokemon.lat.toFixed( 5 ) + " " + pokemon.lng.toFixed( 5 ) +
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
