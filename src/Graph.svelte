<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import { DateTime, Interval, Duration } from "luxon";
  import "chartjs-adapter-luxon";
  import axios from "axios";

  const API_URL = "https://v1.uwe.avrosense.com/";

  // Hardcoded for now
  const DEVICES = [{ id: 1, name: "UWE Probe 1" }];

  let graph;
  let graphCanvas;
  let selectedAverage;
  let start_date = DateTime.now().toFormat("yyyy-MM-dd");
  let end_date = DateTime.now().toFormat("yyyy-MM-dd");

  // Settings for Graph
  const graph_config = {
    type: "line",
    data: {},
    options: {
      plugins: {
        title: {
          text: "",
          display: false,
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            displayFormats: {
              hour: "dd/MM HH:mm",
            },
            // Luxon format string
            tooltipFormat: "DD T",
            time: {
              unit: "day",
            },
          },
          title: {
            display: true,
            text: "Date",
          },
          ticks: {
                    maxRotation: 45,
                    minRotation: 45
            },
        },
        y: {
          title: {
            display: true,
            text: "Nitrogen Dioxide",
          },
        },
      },
    },
  };

  onMount(async function () {
    // Load single day by default
    start_date = DateTime.now().toFormat("yyyy-MM-dd");
    end_date = DateTime.now().toFormat("yyyy-MM-dd");

    // Initialize graph
    graph = new Chart(graphCanvas.getContext("2d"), graph_config);

    await graphLoad();
  });

  function dateChanged(e) {
    graphLoad();
  }

  function averageBetween(start_dt, end_dt, data) {
    let interval = Interval.fromDateTimes(start_dt, end_dt);

    let counter = 0;
    let data_sum = 0;

    for (let i = 0; i < data.length; i++) {
      let t = DateTime.fromFormat(data[i]["time"], "yyyy-MM-dd HH:mm:ss");
      if (interval.contains(t)) {
        data_sum += parseInt(data[i]["value"]);
        counter++
      }
    }

    // create result object
    return {x: start_dt, y: data_sum / counter }
  }

  function graphLoad() {
    console.log(selectedAverage);
    // TODO: make sure start and end dates are valid!

    // Convert start/end into luxon date objects
    // Set time to beggining of start date
    let start = DateTime.fromFormat(start_date, "yyyy-MM-dd").set({
      hour: 0,
      minute: 0,
      second: 0,
    });

    // Set end to end of the end date (to include all data on that day)
    let end = DateTime.fromFormat(end_date, "yyyy-MM-dd").set({
      hour: 23,
      minute: 59,
      second: 59,
    });

    // End date is today - set end to current time so graph uses all space available
    if (end.diff(DateTime.now(), ["hours"]).hours < 24) {
      end = DateTime.now();
    }

    
    // Set graph labels
    graph.data.labels = [start.toJSDate(), end.toJSDate()];

    // Clear existing data sets
    graph.data.datasets = [];

    // For each device, make request for data and add dataset to graph
    for (let i = 0; i < DEVICES.length; i++) {
      let device = DEVICES[i];
      let url = `${API_URL}device/${device.id}?start=${start.toMillis()}&finish=${end.toMillis()}`;
      axios.get(url)
        .then(function (response) {
          averageBetween(start, end, response.data);

          let new_ds = {
            label: device.name,
            fill: false,
            data: [],
          };


          if (selectedAverage == 0) { 
            // don't average anything
            for (let i = 0; i < response.data.length; i++) {
              new_ds.data.push({
                x: DateTime.fromFormat(
                  response.data[i]["time"],
                  "yyyy-MM-dd HH:mm:ss"
                ),
                y: response.data[i]["value"],
              });
            }
          }
          else { 
            let interval = Interval.fromDateTimes(start, end);
            let duration;

            if (selectedAverage == 1) // Hourly Average
              duration = Duration.fromObject({ hours: 1 });
            else // Daily average
              duration = Duration.fromObject({ days: 1 });

            for (let i of interval.splitBy(duration)){
              new_ds.data.push(averageBetween(i.start, i.end, response.data));
            }
          }

          

          graph.data.datasets.push(new_ds);
          graph.update();
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
</script>

<input type="date" bind:value={start_date} on:change={graphLoad} />
<input type="date" bind:value={end_date} on:change={graphLoad} />

<select bind:value={selectedAverage} on:change={graphLoad}>
  <option value="0">No Average</option>
  <option value="1">Hourly Average</option>
  <option value="2">Daily Average</option>
</select>

<canvas id="graph" bind:this={graphCanvas} />
