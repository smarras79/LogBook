import { useMemo } from 'react';
import { getPassengerEstimate, getCarbonEstimate } from '../utils/flights';
import { getAirlineAlliance } from '../utils/airlines';
import { getContinent } from '../utils/geo';

const useFlightStats = (flights) => {
  return useMemo(() => {
    // Calculate total flights (counting each leg as a separate flight, round trips count as 2x)
    const totalFlightLegs = flights.reduce((sum, f) => {
      const baseCount = f.legCount || 1;
      const rtMultiplier = f.isRoundTrip ? 2 : 1;
      return sum + (baseCount * rtMultiplier);
    }, 0);

    // Calculate total miles (round trips count as 2x distance)
    const totalMiles = flights.reduce((sum, f) => {
      const rtMultiplier = f.isRoundTrip ? 2 : 1;
      return sum + (f.distance || 0) * rtMultiplier;
    }, 0);

    // Calculate total fellow passengers (round trips count as 2x since you fly with passengers twice)
    // For multi-leg flights, sum passengers from each leg
    const totalPassengers = flights.reduce((sum, f) => {
      const rtMultiplier = f.isRoundTrip ? 2 : 1;

      // If passengerCount is already calculated and > 0, use it
      if (f.passengerCount && f.passengerCount > 0) {
        return sum + f.passengerCount * rtMultiplier;
      }

      // Otherwise calculate from legs or top-level aircraft
      if (f.legs && f.legs.length > 0) {
        const legPassengers = f.legs.reduce((legSum, leg) => {
          return legSum + getPassengerEstimate(leg.aircraftType);
        }, 0);
        return sum + legPassengers * rtMultiplier;
      }

      // Single flight - use aircraft type or default (123 passengers)
      const pax = getPassengerEstimate(f.aircraftType);
      return sum + pax * rtMultiplier;
    }, 0);

    // Calculate unique countries visited
    const uniqueCountries = [...new Set(flights.flatMap(f => {
      const countries = [];
      if (f.originCountry) countries.push(f.originCountry);
      if (f.destCountry) countries.push(f.destCountry);
      // Also check legs for multi-leg trips
      if (f.legs) {
        f.legs.forEach(leg => {
          if (leg.originCountry) countries.push(leg.originCountry);
          if (leg.destCountry) countries.push(leg.destCountry);
        });
      }
      return countries;
    }).filter(Boolean))];

    // Calculate unique continents visited
    const uniqueContinents = [...new Set(flights.flatMap(f => {
      const continents = [];
      if (f.originContinent) continents.push(f.originContinent);
      if (f.destContinent) continents.push(f.destContinent);
      // Also derive from country if continent not stored
      if (f.originCountry) continents.push(getContinent(f.originCountry));
      if (f.destCountry) continents.push(getContinent(f.destCountry));
      return continents;
    }).filter(c => c && c !== 'Unknown'))];

    // Calculate unique airports
    const uniqueAirports = [...new Set(flights.flatMap(f => {
      const airports = [f.origin, f.destination];
      if (f.legs) {
        f.legs.forEach(leg => {
          airports.push(leg.origin, leg.destination);
        });
      }
      return airports;
    }).filter(Boolean))];

    // Calculate total personal carbon footprint (per leg for multi-leg trips)
    const totalCarbonKg = flights.reduce((sum, f) => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: calculate carbon per leg with its own service class
        return sum + f.legs.reduce((legSum, leg) => {
          return legSum + getCarbonEstimate(leg.distance || 0, leg.serviceClass || 'Economy');
        }, 0);
      } else {
        // Single leg trip
        return sum + getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy');
      }
    }, 0);
    const totalCarbonTons = (totalCarbonKg / 1000).toFixed(2);

    // Calculate total flight emissions (entire aircraft)
    // Using average ~0.14 kg CO2 per passenger-mile * estimated passengers
    const totalFlightCarbonKg = flights.reduce((sum, f) => {
      const passengerCount = f.passengerCount || getPassengerEstimate(f.aircraftType);
      const flightEmissions = (f.distance || 0) * 0.14 * passengerCount;
      return sum + flightEmissions;
    }, 0);
    const totalFlightCarbonTons = (totalFlightCarbonKg / 1000).toFixed(1);

    const featureStats = {};
    flights.forEach(f => {
      if (f.featuresCrossed) {
        f.featuresCrossed.forEach(feat => {
          featureStats[feat] = (featureStats[feat] || 0) + 1;
        });
      }
    });
    const topFeatures = Object.entries(featureStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Airline statistics (count per leg for multi-leg trips)
    const airlineStats = {};
    flights.forEach(f => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: count each leg's airline
        f.legs.forEach(leg => {
          if (leg.airline) {
            airlineStats[leg.airline] = (airlineStats[leg.airline] || 0) + 1;
          }
        });
      } else if (f.airline) {
        // Single leg trip
        airlineStats[f.airline] = (airlineStats[f.airline] || 0) + 1;
      }
    });
    const topAirlines = Object.entries(airlineStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Aircraft statistics (count per leg for multi-leg trips)
    const aircraftStats = {};
    flights.forEach(f => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: count each leg's aircraft
        f.legs.forEach(leg => {
          if (leg.aircraftType && leg.aircraftType !== 'Unknown') {
            aircraftStats[leg.aircraftType] = (aircraftStats[leg.aircraftType] || 0) + 1;
          }
        });
      } else if (f.aircraftType && f.aircraftType !== 'Unknown') {
        // Single leg trip
        aircraftStats[f.aircraftType] = (aircraftStats[f.aircraftType] || 0) + 1;
      }
    });
    const allAircraft = Object.entries(aircraftStats).sort((a, b) => b[1] - a[1]);
    const topAircraft = allAircraft.slice(0, 5);

    // Alliance statistics (count per leg for multi-leg trips)
    const allianceStats = {};
    let totalFlightsWithAirlines = 0;
    flights.forEach(f => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: count each leg's alliance
        f.legs.forEach(leg => {
          if (leg.airline) {
            const alliance = getAirlineAlliance(leg.airline);
            allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
            totalFlightsWithAirlines++;
          }
        });
      } else if (f.airline) {
        // Single leg trip
        const alliance = getAirlineAlliance(f.airline);
        allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
        totalFlightsWithAirlines++;
      }
    });
    const sortedAlliances = Object.entries(allianceStats)
      .sort((a, b) => b[1] - a[1]);
    const dominantAlliance = sortedAlliances.length > 0 ? sortedAlliances[0][0] : null;

    // Service class statistics (count per leg for multi-leg trips)
    const classStats = {};
    flights.forEach(f => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: count each leg's service class
        f.legs.forEach(leg => {
          const cls = leg.serviceClass || 'Economy';
          classStats[cls] = (classStats[cls] || 0) + 1;
        });
      } else if (f.serviceClass) {
        // Single leg trip
        classStats[f.serviceClass] = (classStats[f.serviceClass] || 0) + 1;
      }
    });
    const classOrder = ['First', 'Business', 'Premium Economy', 'Economy'];
    const sortedClasses = Object.entries(classStats).sort((a, b) => {
      return classOrder.indexOf(a[0]) - classOrder.indexOf(b[0]);
    });

    // Personal carbon footprint by class (calculated per leg for multi-leg trips)
    const carbonByClass = {};
    flights.forEach(f => {
      if (f.legs && f.legs.length > 1) {
        // Multi-leg trip: calculate carbon per leg with its own service class
        f.legs.forEach(leg => {
          const cls = leg.serviceClass || 'Economy';
          const carbon = getCarbonEstimate(leg.distance || 0, cls);
          carbonByClass[cls] = (carbonByClass[cls] || 0) + carbon;
        });
      } else {
        // Single leg trip
        const cls = f.serviceClass || 'Economy';
        const carbon = getCarbonEstimate(f.distance || 0, cls);
        carbonByClass[cls] = (carbonByClass[cls] || 0) + carbon;
      }
    });
    const sortedCarbonByClass = Object.entries(carbonByClass).sort((a, b) => b[1] - a[1]);

    // Payment statistics
    const paymentStats = flights.reduce((acc, f) => {
      if (f.paymentAmount && !isNaN(parseFloat(f.paymentAmount))) {
        const amount = parseFloat(f.paymentAmount);
        if (f.paymentType === 'miles') {
          acc.totalMilesSpent += amount;
          acc.milesFlightCount += 1;
        } else {
          acc.totalMoneySpent += amount;
          acc.moneyFlightCount += 1;
        }
      }
      return acc;
    }, { totalMilesSpent: 0, totalMoneySpent: 0, milesFlightCount: 0, moneyFlightCount: 0 });

    // Group flights by route for consolidated display
    const groupedFlights = flights.reduce((acc, flight) => {
      const routeKey = `${flight.origin}-${flight.destination}`;
      if (!acc[routeKey]) {
        acc[routeKey] = {
          origin: flight.origin,
          destination: flight.destination,
          originCity: flight.originCity,
          destCity: flight.destCity,
          originCountry: flight.originCountry,
          destCountry: flight.destCountry,
          originContinent: flight.originContinent || getContinent(flight.originCountry),
          destContinent: flight.destContinent || getContinent(flight.destCountry),
          featuresCrossed: flight.featuresCrossed,
          distance: flight.distance,
          flights: []
        };
      }
      acc[routeKey].flights.push(flight);
      return acc;
    }, {});

    // Sort flights within each group by date (newest first)
    Object.values(groupedFlights).forEach(group => {
      group.flights.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // Group flights by country
    const getGroupedByCountry = () => {
      const byCountry = {};
      Object.values(groupedFlights).forEach(group => {
        const countries = [...new Set([group.originCountry, group.destCountry].filter(Boolean))];
        countries.forEach(country => {
          if (!byCountry[country]) {
            byCountry[country] = { country, groups: [] };
          }
          if (!byCountry[country].groups.find(g => g.origin === group.origin && g.destination === group.destination)) {
            byCountry[country].groups.push(group);
          }
        });
      });
      return Object.values(byCountry).sort((a, b) => a.country.localeCompare(b.country));
    };

    // Group flights by continent
    const getGroupedByContinent = () => {
      const byContinent = {};
      Object.values(groupedFlights).forEach(group => {
        const continents = [...new Set([group.originContinent, group.destContinent].filter(c => c && c !== 'Unknown'))];
        continents.forEach(continent => {
          if (!byContinent[continent]) {
            byContinent[continent] = { continent, groups: [] };
          }
          if (!byContinent[continent].groups.find(g => g.origin === group.origin && g.destination === group.destination)) {
            byContinent[continent].groups.push(group);
          }
        });
      });
      // Sort continents in a logical order
      const continentOrder = ['North America', 'South America', 'Europe', 'Africa', 'Middle East', 'Asia', 'Oceania'];
      return Object.values(byContinent).sort((a, b) => {
        const aIdx = continentOrder.indexOf(a.continent);
        const bIdx = continentOrder.indexOf(b.continent);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    };

    // Convert to array and sort by most recent flight date (default)
    const sortedGroups = Object.values(groupedFlights).sort((a, b) => {
      const aDate = new Date(a.flights[0].date);
      const bDate = new Date(b.flights[0].date);
      return bDate - aDate;
    });

    const groupedByCountry = getGroupedByCountry();
    const groupedByContinent = getGroupedByContinent();

    return {
      totalFlightLegs,
      totalMiles,
      totalPassengers,
      uniqueCountries,
      uniqueContinents,
      uniqueAirports,
      totalCarbonKg,
      totalCarbonTons,
      totalFlightCarbonKg,
      totalFlightCarbonTons,
      featureStats,
      topFeatures,
      airlineStats,
      topAirlines,
      aircraftStats,
      allAircraft,
      topAircraft,
      allianceStats,
      totalFlightsWithAirlines,
      sortedAlliances,
      dominantAlliance,
      classStats,
      sortedClasses,
      carbonByClass,
      sortedCarbonByClass,
      paymentStats,
      groupedFlights,
      sortedGroups,
      groupedByCountry,
      groupedByContinent,
    };
  }, [flights]);
};

export default useFlightStats;
