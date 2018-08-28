<template>
  <div class="hello">
    <h1>Search</h1>
    <input v-model="term" type="search"> <button @click="search">Search</button>
    <div v-if="results">
      <Result v-for="result in results" :key="result.Link"
        :link="result.Link" :api="result.API" :desc="result.Description"
      />
    </div>
  </div>
</template>

<script>
import Result from '../components/Result';
export default {
  name: 'Search',
  components:{
    Result
  },
  data() { 
    return {
      term:'',
      results:null
    }
  },
  methods:{
    search() {
      if(this.term.trim() === '') return;
      fetch(`https://api.publicapis.org/entries?title=${encodeURIComponent(this.term)}`)
      .then(res => res.json())
      .then(res => {
        this.results = res.entries;
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
