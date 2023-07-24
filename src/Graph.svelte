<!--
<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import { DateTime, Interval, Duration } from "luxon";
  import "chartjs-adapter-luxon";
  import axios from "axios";
  import { getDevices, getData } from "./data.js";
  import zoomPlugin from "chartjs-plugin-zoom";

  Chart.register(zoomPlugin);

  let devices = [];
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
        zoom: {
          pan: {
            enabled: true,
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
          },
        },
      },
      actions: [
        {
          name: "Reset zoom",
          handler(chart) {
            chart.resetZoom();
          },
        },
      ],
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
            minRotation: 45,
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

    // Get Devices from api
    devices = await getDevices();

    graph = new Chart(graphCanvas.getContext("2d"), graph_config);

    await graphLoad();
  });

  function dateChanged(e) {
    graphLoad();
  }

  function resetZoom() {
    graph.resetZoom();
  }

  async function graphLoad() {
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

    let duration = null;

    if (selectedAverage == 1) duration = { hours: 1 };
    else if (selectedAverage == 2) duration = { days: 1 };

    // Get Data From API
    let data = await getData(start, end, devices, duration);

    // For each device, add data to the graph
    for (let i = 0; i < data.length; i++) {
      // Create new dataset for this device
      let new_ds = {
        label: data[i].device.name,
        fill: false,
        data: [],
      };

      for (let y = 0; y < data[i].data.length; y++) {
        new_ds.data.push({ x: data[i].data[y].time, y: data[i].data[y].value });
      }

      graph.data.datasets.push(new_ds);
      graph.update();
    }

    graph.resetZoom();
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

<button on:click={resetZoom}>Reset View</button>
-->