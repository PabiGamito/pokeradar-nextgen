// Toggle sidebar
$( ".open-side-menu" ).click( function() {
	if ( $( "#side-menu" ).is( ":visible" ) ) {
		$( "#side-menu" ).hide( "slide", {
			direction: "left"
		}, 500 );
	} else {
		$( "#side-menu" ).show( "slide", {
			direction: "left"
		}, 500 );
	}

} );

// LOCATE //
$( "#locateMe" ).click( function() {
	locate();
} );
