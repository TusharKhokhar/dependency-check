const axios = require('axios');
const {getApiKey} = require("../services/iot-handler");
const {region} = require("../config/config");
const { find } = require('geo-tz')

const formatLocation = async (location, customerId) => {
    const addressResult = await fetchLocation(location.Address, location.City, location.State,
      location.Country, location.ZipCode);
    const timezone = getTimezoneByLatLon(addressResult?.latitude, addressResult?.longitude)
    const final =  {
        Location: location.Location,
        Description: location.Description,
        Tags: location.Tags && location.Tags!== '' ? location.Tags?.split(',') : [],
        Address: addressResult?.formattedAddress || location.Address,
        TimeZone: timezone,
        Latitude: addressResult?.latitude,
        Longitude: addressResult?.longitude,
        CustomerID: customerId,
        CurrencyCode: location.CurrencyCode,
        IsDeleted: false,
        IsActive: true,
        Searchable: location.Searchable?.toLowerCase() === "true",
        "Rule" : {
            "OpenTimes" : {
                "DayHours": []
            }
        }
    };
    if (location.OpenHoursOne && location.ClosingHoursOne && location.DayOne) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursOne,
            CloseTimes: location.ClosingHoursOne,
            Day: location.DayOne,
            "Enable" : true
        });
    }
    if (location.OpenHoursTwo && location.ClosingHoursTwo && location.DayTwo) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursTwo,
            CloseTimes: location.ClosingHoursTwo,
            Day: location.DayTwo,
            "Enable" : true
        });
    }
    if (location.OpenHoursThree && location.ClosingHoursThree && location.DayThree) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursThree,
            CloseTimes: location.ClosingHoursThree,
            Day: location.DayThree,
            "Enable" : true
        });
    }
    if (location.OpenHoursFour && location.ClosingHoursFour && location.DayFour) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursFour,
            CloseTimes: location.ClosingHoursFour,
            Day: location.DayFour,
            "Enable" : true
        });
    }
    if (location.OpenHoursFive && location.ClosingHoursFive && location.DayFive) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursFive,
            CloseTimes: location.ClosingHoursFive,
            Day: location.DayFive,
            "Enable" : true
        });
    }
    if (location.OpenHoursSix && location.ClosingHoursSix && location.DaySix) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursSix,
            CloseTimes: location.ClosingHoursSix,
            Day: location.DaySix,
            "Enable" : true
        });
    }
    if (location.OpenHoursSeven && location.ClosingHoursSeven && location.DaySeven) {
        final.Rule.OpenTimes.DayHours.push({
            OpenTimes: location.OpenHoursSeven,
            CloseTimes: location.ClosingHoursSeven,
            Day: location.DaySeven,
            "Enable" : true
        });
    }
    return final;
}

const fetchLocation = async (address, city, state, country, zipCode) => {
    const formatAddress = `${address}, ${city}, ${state}, ${country}, ${zipCode}`;
    console.log('formatAddress: ',formatAddress);
    const {googleAPIKey: GOOGLE_API_KEY} = await getApiKey(region);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formatAddress)}&key=${GOOGLE_API_KEY}`,
        headers: { }
    };
    let response = await axios.request(config)
    const responseData = response?.data
    if (responseData?.results?.length === 0) {
        return {
            latitude: null,
            longitude: null,
            formattedAddress: formatAddress
        };
    } else {
        return {
            latitude: responseData?.results[0]?.geometry?.location?.lat,
            longitude: responseData?.results[0]?.geometry?.location?.lng,
            formattedAddress: responseData?.results[0]?.formatted_address
        };
    }
}

const getTimezoneByLatLon = (latitude, longitude) => {
    if (latitude == null || longitude == null) {
        return null;
    }
    const timezone = find(latitude, longitude);
    console.log('timezone--------', timezone);
    return timezone ? timezone[0] : null;
}

module.exports = { formatLocation }
