<template>
    <div>

        <h1>Service List</h1>
        <div v-if="loading">
        Looking up your location...
        </div>

        <div v-if="error">
        I'm sorry, but I had a problem getitng your location. Check the console for details.
        </div>

        <div v-if="!loading && !error">
            <b-list-group>
                <b-list-group-item v-for="service in serviceTypes" :key="service.id">
                    <router-link :to="{name:'typeList', params:{type:service.id, name:service.label, lat:lat, lng:lng} }">{{service.label}}</router-link>
                </b-list-group-item>
            </b-list-group>
        </div>

    </div>
</template>

<script>
export default {
    name:'ServiceList',
    data () {
        return {
            error:false,
            loading:true,
            lat:null,
            lng:null,
            serviceTypes:[
                {"id":"accounting","label":"Accounting"},{"id":"airport","label":"Airport"},{"id":"amusement_park","label":"Amusement Park"},{"id":"aquarium","label":"Aquarium"},
                {"id":"art_gallery","label":"Art Gallery"},{"id":"atm","label":"ATM"},{"id":"bakery","label":"Bakery"},{"id":"bank","label":"Bank"},
                {"id":"bar","label":"Bar"},{"id":"beauty_salon","label":"Beauty Salon"},
                {"id":"bicycle_store","label":"Bicycle Store"},{"id":"book_store","label":"Book Store"},
                {"id":"bowling_alley","label":"Bowling Alley"},{"id":"bus_station","label":"Bus Station"},
                {"id":"cafe","label":"Cafe"},{"id":"campground","label":"Campground"},
                {"id":"car_dealer","label":"Car Dealer"},{"id":"car_rental","label":"Car Rental"},
                {"id":"car_repair","label":"Car Repair"},{"id":"car_wash","label":"Car Wash"},
                {"id":"casino","label":"Casino"},{"id":"cemetery","label":"Cemetery"},
                {"id":"church","label":"Church"},{"id":"city_hall","label":"City Hall"},
                {"id":"clothing_store","label":"Clothing store"},{"id":"convenience_store","label":"Convenience store"},
                {"id":"courthouse","label":"Courthouse"},{"id":"dentist","label":"Dentist"},
                {"id":"department_store","label":"Department Store"},{"id":"doctor","label":"Doctor"},
                {"id":"electrician","label":"Electrician"},{"id":"electronics_store","label":"Electronics Store"},
                {"id":"embassy","label":"Embassy"},{"id":"establishment","label":"Establishment"},
                {"id":"finance","label":"Finance"},{"id":"fire_station","label":"Fire Station"},
                {"id":"florist","label":"Florist"},{"id":"food","label":"Food"},
                {"id":"funeral_home","label":"Funeral Home"},{"id":"furniture_store","label":"Furniture Store"},
                {"id":"gas_station","label":"Gas Station"},{"id":"general_contractor","label":"General Contractor"},
                {"id":"geocode","label":"Geocode"},{"id":"grocery_or_supermarket","label":"Grocery or Supermarket"},
                {"id":"gym","label":"Gym"},{"id":"hair_care","label":"Hair Care"},
                {"id":"hardware_store","label":"Hardware Store"},{"id":"health","label":"Health"},
                {"id":"hindu_temple","label":"Hindu Temple"},{"id":"home_goods_store","label":"Home Goods Store"},
                {"id":"hospital","label":"Hospital"},{"id":"insurance_agency","label":"Insurance Agency"},
                {"id":"jewelry_store","label":"Jewelry Store"},{"id":"laundry","label":"Laundry"},
                {"id":"lawyer","label":"Lawyer"},{"id":"library","label":"Library"},
                {"id":"liquor_store","label":"Liquor Store"},{"id":"local_government_office","label":"Local Government Office"},
                {"id":"locksmith","label":"Locksmith"},{"id":"lodging","label":"Lodging"},
                {"id":"meal_delivery","label":"Meal Delivery"},{"id":"meal_takeaway","label":"Meal Takeaway"},
                {"id":"mosque","label":"Mosque"},{"id":"movie_rental","label":"Movie Rental"},
                {"id":"movie_theater","label":"Movie Theater"},{"id":"moving_company","label":"Moving Company"},
                {"id":"museum","label":"Museum"},{"id":"night_club","label":"Night Club"},
                {"id":"painter","label":"Painter"},{"id":"park","label":"Park"},
                {"id":"parking","label":"Parking"},{"id":"pet_store","label":"Pet Store"},
                {"id":"pharmacy","label":"Pharmacy"},{"id":"physiotherapist","label":"Physiotherapist"},
                {"id":"place_of_worship","label":"Place of Worship"},{"id":"plumber","label":"Plumber"},
                {"id":"police","label":"Police"},{"id":"post_office","label":"Post Office"},
                {"id":"real_estate_agency","label":"Real Estate Agency"},{"id":"restaurant","label":"Restaurant"},{"id":"roofing_contractor","label":"Roofing Contractor"},
                {"id":"rv_park","label":"RV Park"},{"id":"school","label":"School"},
                {"id":"shoe_store","label":"Shoe Store"},{"id":"shopping_mall","label":"Shopping Mall"},
                {"id":"spa","label":"Spa"},{"id":"stadium","label":"Stadium"},
                {"id":"storage","label":"Storage"},{"id":"store","label":"Store"},
                {"id":"subway_station","label":"Subway Station"},{"id":"synagogue","label":"Synagogue"},
                {"id":"taxi_stand","label":"Taxi Stand"},{"id":"train_station","label":"Train Station"},
                {"id":"travel_agency","label":"Travel Agency"},{"id":"university","label":"University"},
                {"id":"veterinary_care","label":"Veterinary Care"},{"id":"zoo","label":"Zoo"}
            ]
        }
    },
    mounted:function () {
        this.$nextTick(function () {
            if (this.lat === null) {
                console.log('get geolocation', this.lat);
                let that = this;
                navigator.geolocation.getCurrentPosition(function (res) {
                    console.log(res);
                    that.lng = res.coords.longitude;
                    that.lat = res.coords.latitude;
                    that.loading = false;
                }, function (err) {
                    console.error(err);
                    that.loading = false;
                    that.error = true;
                });
            }
        })
    }
}
</script>