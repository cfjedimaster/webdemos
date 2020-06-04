Vue.config.productionTip = false;
Vue.config.devtools = false;

const app = new Vue({
  el:'#app',
  data: {
    canCopy:false,
    ytlink:'',
    results:null
  },
  created() {
    this.canCopy = !!navigator.clipboard;
  },
  methods: {
    async copy(s) {
      await navigator.clipboard.writeText(s);
      console.log('copied '+s);
    },
    getURLs() {
      if(this.ytlink === '') return;
      console.log("get id from "+this.ytlink);

      let matches = this.ytlink.match(/v=([^&]+)?/);
      if(matches.length >= 1) {
        let id = matches[1];
        this.results = [];
        console.log(id);
        for(let x=0;x<=3;x++) {
          this.results.push(`https://img.youtube.com/vi/${id}/${x}.jpg`);
        }
      }
    }
  }
})