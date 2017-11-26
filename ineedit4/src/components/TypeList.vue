<template>
    <div>

        <h1>{{name}}</h1>

        <div v-if="loading">
        Looking up data...
        </div>

        <div v-if="!loading">
            <b-list-group>
                <b-list-group-item v-for="result in results" :key="result.id">
                <router-link :to="{name:'detail', params:{placeid:result.place_id} }">{{result.name}}</router-link>
                </b-list-group-item>
            </b-list-group>

            <p v-if="results.length === 0">
            Sorry, no results.
            </p>

            <p>
            <router-link to="/">Back</router-link>
            </p>
        </div>

    </div>
</template>

<script>
const SEARCH_API = 'https://openwhisk.ng.bluemix.net/api/v1/web/rcamden%40us.ibm.com_My%20Space/googleplaces/search.json';

// used for search max distance
const RADIUS = 2000;

export default {
    name:'ServiceList',
    data () {
        return {
			results:[],
			loading:true
        }
    },
	created:function () {
		fetch(SEARCH_API +
		'?lat=' + this.lat + '&lng=' + this.lng + '&type=' + this.type + '&radius=' + RADIUS)
		.then(res => res.json())
		.then(res => {
			console.log('res', res);
			this.results = res.result;
			this.loading = false;
		});
	},
	props:['name','type','lat','lng']
}
</script>