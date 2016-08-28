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

// Create Marker Clusters
var markerClusters = new L.MarkerClusterGroup( {
	showCoverageOnHover: true,
	zoomToBoundsOnClick: true,
	maxClusterRadius: 80
} );
map.addLayer( markerClusters );

// END LOAD MAP
