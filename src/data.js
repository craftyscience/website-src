import axios from "axios";
import { DateTime, Interval, Duration } from "luxon";

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

export async function getDevices() {
    return new Promise((resolve) => {
        axios.get(API_URL + "devices").then(function (response) {
            resolve(response.data);
        }).catch(function (error) {
            console.log("An error occured fetching devices.", error);
            resolve(null);
        });
    });
}

async function getDeviceData(startDate, endDate, device, averageDuration = null) {
    return new Promise((resolve) => {
        let result = {};
        result["device"] = device;
        result["data"] = [];

        let url = `${API_URL}device/${device.id}?start=${startDate.toMillis()}&finish=${endDate.toMillis()}`;

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

export async function getData(startDate, endDate, devices, averageDuration = null) {
    let result = [];
    let promises = [];

    for (let i = 0; i < devices.length; i++) {
        promises.push(getDeviceData(startDate, endDate, devices[i], averageDuration)); 
    }

    result = await Promise.all(promises);
    return result;
}