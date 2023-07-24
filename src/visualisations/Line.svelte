<script>
    import { onDestroy, onMount } from "svelte";
    import Chart from "chart.js/auto";
    import "chartjs-adapter-luxon";
    import zoomPlugin from "chartjs-plugin-zoom";
    import {get} from "svelte/store";
    import {dataReadings, dataDevices} from "./../data.js"
    import { Colors } from 'chart.js';

    Chart.register(zoomPlugin);
    Chart.register(Colors);

    let graph;
    let graphCanvas;
    let unsubscribe;

    const graph_config = {
    type: "line",
    data: {},
    options: {
      plugins: {
        colors: {
      enabled: true,
      forceOverride: true
    },
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

  function applyDataset()
  {
    // Clear existing data sets
    graph.data.datasets = [];

    let data = get(dataReadings);
    console.log("Applying Dataset", data);
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

    onMount(async function () {
        console.log("Calling compoenent mount for chart!");
        graph = new Chart(graphCanvas.getContext("2d"), graph_config);
        unsubscribe = dataReadings.subscribe(() => applyDataset());
        applyDataset();
    });

    onDestroy(function() {
        unsubscribe();
    });

    function resetZoom() {
      graph.resetZoom();
    }

</script>

<div>
    <canvas id="graph" bind:this={graphCanvas} />
    <a on:click={resetZoom} href="javascript:;">Reset Zoom</a>
</div>
