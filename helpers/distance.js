const { getDistance } = require('geolib');

function isWithinRange(userLat, userLng, projectLat, projectLng) {
  const distance = getDistance(
    { latitude: userLat, longitude: userLng },
    { latitude: projectLat, longitude: projectLng }
  );

  return {
    valid: distance <= 500,
    distance
  };
}

module.exports = { isWithinRange };