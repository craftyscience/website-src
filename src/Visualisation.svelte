<script>
    import {get_current_component} from 'svelte/internal'
    import { onMount } from "svelte";
    import '@fortawesome/fontawesome-free/js/all.js';

    const THISComponent = get_current_component()

    export let name;
    export let comp;

    function remove() {
        THISComponent.$destroy();
    }

</script>

<div>
    <div class="container">

        <!-- columns should be the immediate child of a .row -->
        <div class="row">
          
          <div class="eleven columns"><b>{name}</b></div>
          <div class="one column"><button on:click={remove}><span><i class="fa-solid fa-trash"></i></span></button></div>
        </div>
    </div>

    
    
    <svelte:component this={comp}></svelte:component>
   
    
</div>