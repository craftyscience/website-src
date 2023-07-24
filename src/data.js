import axios from "axios";
import { DateTime, Interval, Duration } from "luxon";
import { get, writable } from "svelte/store";

// Svelte Store
export const dataDevices = writable(0);
export const dataReadings = writable(0);

const API_URL = "https://v1.uwe.avrosense.com/";

function averageBetween(start_dt, end_dt, data) {
    let interval = Interval.fromDateTimes(start_dt, end_dt);

    let counter = 0;
    let data_sum = 0;

    for (let i = 0; i < data.length; i++) {
      let t = DateTime.fromFormat(data[i]["time"], "yyyy-MM-dd HH:mm:ss");
      if (interval.contains(t)) {
        data_sum += parseInt(data[i]["value"]);
        counter++;
      }
    }

    // create result object
    return { time: start_dt, value: data_sum / counter };
}

export async function loadDevices() {

    axios.get(API_URL + "devices").then(function (response) {
        dataDevices.set(response.data);
    }).catch(function (error) {
        console.log("An error occured fetching devices.", error);
    });
    
    /*
    return new Promise((resolve) => {
        axios.get(API_URL + "devices").then(function (response) {
            resolve(response.data);
            devices.set(response.data);
        }).catch(function (error) {
            console.log("An error occured fetching devices.", error);
            resolve(null);
        });
    });
    */
}

async function getDeviceData(startDate, endDate, device, averageDuration = null) {
    return new Promise((resolve) => {
        let result = {};
        result["device"] = device;
        result["data"] = [];

        let url = `${API_URL}device/${device.id}?start=${startDate.toMillis()}&finish=${endDate.toMillis()}`;
        console.log(url)
        axios.get(url).then(function (response) {

            if (averageDuration == null) {
                for (let i = 0; i < response.data.length; i++) {
                    result["data"].push({
                        time: DateTime.fromFormat(response.data[i]["time"], "yyyy-MM-dd HH:mm:ss"),
                        value: response.data[i]["value"]
                    })
                }
            }
            else {
                let duration = Duration.fromObject(averageDuration);
                let interval = Interval.fromDateTimes(startDate, endDate);
                for (let i of interval.splitBy(duration)) {
                    result["data"].push(averageBetween(i.start, i.end, response.data));
                }
            }
            resolve(result);
        }).catch(function (error) {
            console.log("An error occured fetching data for device", device);
            console.log(error);
        });

    });
}

export async function loadData(startDate, endDate, averageDuration = null) {

    let start = DateTime.fromFormat(startDate, "yyyy-MM-dd").set({
        hour: 0,
        minute: 0,
        second: 0,
      });
  
    // Set end to end of the end date (to include all data on that day)
    let end = DateTime.fromFormat(endDate, "yyyy-MM-dd").set({
        hour: 23,
        minute: 59,
        second: 59,
    });
  
    // End date is today - set end to current time so graph uses all space available
    if (end.diff(DateTime.now(), ["hours"]).hours < 24) {
        end = DateTime.now();
    }

    let duration = null;
    if (averageDuration == 1) duration = { hours: 1 };
    else if (averageDuration == 2) duration = { days: 1 };

    let result = [];
    let promises = [];
    let devices = get(dataDevices);
    console.log("Devices For Load", devices);
    for (let i = 0; i < devices.length; i++) {
        promises.push(getDeviceData(start, end, devices[i], duration)); 
    }

    result = await Promise.all(promises);

    dataReadings.set(result);
}

export async function getData(startDate, endDate, devices, averageDuration = null) {
    let result = [];
    let promises = [];

    for (let i = 0; i < devices.length; i++) {
        promises.push(getDeviceData(startDate, endDate, devices[i], averageDuration)); 
    }

    result = await Promise.all(promises);
    return result;
}