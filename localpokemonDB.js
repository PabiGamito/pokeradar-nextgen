// Define database
var db = new Dexie( "pokemon_database" );
db.delete();
db.version( 1 ).stores( {
	loaded_pokemons: 'id, markerId',
	markers: 'id++, pokemonId, markerObject'
} );

// Open it
db.open().catch( function( e ) {
	alert( "Open DB failed: " + e );
} );

// Put some data into it
db.friends.put( {
	name: "Nicolas",
	shoeSize: 8
} ).then( function() {
	//
	// Then when data is stored, read from it
	//
	return db.friends.get( 'Nicolas' );
} ).then( function( friend ) {
	//
	// Display the result
	//
	alert( "Nicolas has shoe size " + friend.shoeSize );
} ).catch( function( error ) {
	//
	// Finally don't forget to catch any error
	// that could have happened anywhere in the
	// code blocks above.
	//
	alert( "Ooops: " + error );
} );
