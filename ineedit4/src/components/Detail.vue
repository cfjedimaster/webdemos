<template>
    <div>
        <div v-if="loading">
        Looking up data...
        </div>

        <div v-if="!loading">

            <b-card :title="detail.name" :sub-title="detail.formatted_address">

                <p class="card-text">
                    This business is currently 
                    <span v-if="detail.opening_hours">
                        <span v-if="detail.opening_hours.open_now">open.</span><span v-else>closed.</span>
                    </span>
                    <br/>
                    Phone: {{detail.formatted_phone_number}}<br/>
                    Website: <a :href="detail.website" target="_new">{{detail.website}}</a><br/>
                    <span v-if="detail.price">Items here are generally priced "{{detail.price}}".</span>
                </p>

                <p>
                <img :src="detail.mapUrl" width="310" height="310" class="full-image" />
                </p>

                <b-carousel id="carousel1"
                controls
                indicators
                :interval="0"
                >
                      <b-carousel-slide 
                        v-for="img in detail.photos" :key="img.url" style="height:300px">
                            <img slot="img" :src="img.url" class="d-block img-fluid w-100" style="overflow:hidden">
                      </b-carousel-slide>
                </b-carousel>
            </b-card>

            <b-button block variant="primary" @click.prevent="goBack" style="margin-top:10px">Go Back</b-button>
        </div>
    </div>
</template>

<script>
const DETAIL_API = 'https://openwhisk.ng.bluemix.net/api/v1/web/rcamden%40us.ibm.com_My%20Space/googleplaces/detail.json';
// used for static maps + google places photos
const KEY = 'sorrymakethisreal';

export default {
    name:'Detail',
    data () {
        return {
			detail:[],
			loading:true
        }
    },
   	methods:{
		goBack:function () {
			this.$router.go(-1);
		}
	},
	created:function () {
		fetch(DETAIL_API +
		'?placeid=' + this.placeid)
		.then(res => res.json())
		.then(res => {
			console.log('res', res.result);
			/*
			modify res.result to include a nice label for price
			*/
			res.result.price = '';
			if (res.price_level) {
				if (res.result.price_level === 0) res.result.price = "Free";
				if (res.result.price_level === 1) res.result.price = "Inexpensive";
				if (res.result.price_level === 2) res.result.price = "Moderate";
				if (res.result.price_level === 3) res.result.price = "Expensive";
				if (res.result.price_level === 4) res.result.price = "Very expensive";
            }

            if (res.result.photos) {
                res.result.photos.forEach((p) => {
                    p.url = `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&maxwidth=400&photoreference=${encodeURIComponent(p.photo_reference)}&key=${KEY}`;
                });
            }

			this.detail = res.result;
			// add a google maps url
			this.detail.mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${this.detail.geometry.location.lat},${this.detail.geometry.location.lng}&zoom=14&markers=color:blue%7C${this.detail.geometry.location.lat},${this.detail.geometry.location.lng}&size=310x310&key=${KEY}`;
			this.loading = false;
		});
	},
	props:['placeid']
}
</script>