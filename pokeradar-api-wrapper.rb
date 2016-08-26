# https://www.pokeradar.io/api/v1/submissions?minLatitude=40.57432635193039&maxLatitude=40.98197154086656&minLongitude=-74.48043823242188&maxLongitude=-73.48068237304688&pokemonId=149

require 'rest-client'
require 'openssl'
require 'addressable/uri'
require 'json'

module Pokeradar

  def self.find(pokemonId, minLatitude, maxLatitude, minLongitude, maxLongitude)
    get pokemonId: pokemonId, minLatitude: minLatitude, maxLatitude: maxLatitude, minLongitude: minLongitude, maxLongitude: maxLongitude
  end

  protected

  def self.resource
    @@resouce ||= RestClient::Resource.new( 'https://www.pokeradar.io/api/v1/' )
  end

  def self.get( params = {} )
    response = resource[ 'submissions' ].get params: params
    response = JSON.parse(response)
    if response["success"]
      return response["data"]
    else
      # TODO: ERROR HANDLING
      return false
    end
  end

end
