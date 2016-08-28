// Toggle side menu
$( ".open-side-menu" ).click( function() {
	if ( $( "#app-container" ).css( "margin-left" ) === "0px" ) {
		$( "#app-container" ).animate( {
			marginLeft: $( "#side-menu" ).width()
		} );
		$( ".fixed-action-btn" ).animate( {
			marginLeft: $( "#side-menu" ).width()
		} );
	} else {
		$( "#app-container" ).animate( {
			marginLeft: 0
		} );
		$( ".fixed-action-btn" ).animate( {
			marginLeft: 0
		} );
	}
} );

// List Pokemons in Side Menu
function loadPokemons() {
	pokemonDB.loadedPokemons
		.where( "created" )
		.between( Math.floor( Date.now() / 1000 ) - 60 * 15, Date.now(), false, true ) // false = first param not included when searching
		.toArray()
		.then( function( pokemons ) {
			for ( i = 0; i < pokemons.length; i++ ) {
				var pokemon = pokemons[ i ];
				console.log( "Pokemon", pokemon );
			}
		} );
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
