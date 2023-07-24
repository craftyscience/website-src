<script>
    import { loadDevices, loadData, getData, dataReadings, dataDevices } from "./data.js";
    import { get } from "svelte/store";
    import { onMount } from "svelte";

    import { DateTime, Interval, Duration } from "luxon";
    import { get_current_component } from 'svelte/internal'
    
    // Visualisations
    import Visualisation from "./Visualisation.svelte";
    import Line from "./visualisations/Line.svelte";

    let startDate = DateTime.now().toFormat("yyyy-MM-dd");
    let endDate = DateTime.now().toFormat("yyyy-MM-dd");
    let selectedAverage;

    onMount(async function () {
        await loadDevices();
        await loadData(startDate, endDate, selectedAverage);
        add();
    });

    async function reloadData() {
        await loadDevices();
        await loadData(startDate, endDate, selectedAverage);
    }

    let components = []
    let selectedComponent;

    function add(component, props) {
        let new_component = new Visualisation({
            target: document.querySelector('#comp'),
            props: {comp: Line, name : 'Line'},
        });
        components.push(new_component);
	}

    function remove(index) {
        console.log("Remove ", index)
        components.splice(index, 1);
    }

</script>


<div>
   <!-- Date Inputs -->
    <input type="date" bind:value={startDate} on:change={reloadData} />
    <input type="date" bind:value={endDate} on:change={reloadData} />

    <!-- Average Selector -->
    <select bind:value={selectedAverage} on:change={reloadData}>
        <option value="0">No Average</option>
        <option value="1">Hourly Average</option>
        <option value="2">Daily Average</option>
    </select>

    <div id="comp"></div>
    <hr>

    <!-- Add new visualisation -->
    <select bind:value={selectedComponent}>
        <option value="1">Line</option>
    </select>

    <button on:click={() => add(Line, { })}>Add</button>
</div>