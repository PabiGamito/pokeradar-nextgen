// Toggle sidebar
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
