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
			map.setView( locationMarker.getLatLng(), 17 );
		};
		return container;
	}

} );

map.addControl( new zoomInControl() );
map.addControl( new zoomOutControl() );
map.addControl( new locateControl() );

// END LOAD MAP

// Create Marker Clusters
var markerClusters = new L.MarkerClusterGroup( {
	showCoverageOnHover: true,
	zoomToBoundsOnClick: true,
	maxClusterRadius: 80
} );
map.addLayer( markerClusters );

// LOCATION AND LOAD POKEMONS
var locationMarker;
var locationCircle;

map.locate( {
		setView: true,
		watch: true,
		maxZoom: 17
	} )
	.on( 'locationfound', function( e ) {
		try {
			map.removeLayer( locationMarker );
			map.removeLayer( locationCircle );
		} catch ( err ) {
			console.log( err );
		}
		map.setView( [ e.latitude, e.longitude ], 17 );

		// TODO: Use circle marker instead http://leafletjs.com/reference.html#circlemarke
		var locationIcon = L.icon( {
			iconUrl: 'img/icons/locationIcon.png',
			iconSize: [ 16, 16 ], // size of the icon
		} );
		locationMarker = L.marker( [ e.latitude, e.longitude ], {
			"icon": locationIcon
		} );
		locationCircle = L.circle( [ e.latitude, e.longitude ], e.accuracy, {
			weight: 1,
			// color: 'blue',
			stroke: false,
			fillColor: '#cacaca',
			fillOpacity: 0.5
		} );
		map.addLayer( locationMarker );
		map.addLayer( locationCircle );

		refreshPokemons();
		StartAutoUpdates();
	} )
	.on( 'locationerror', function( e ) {
		console.log( e );
		$( ".locateControl" ).addClass( "disabled" );
		refreshPokemons();
		StartAutoUpdates();
	} );
